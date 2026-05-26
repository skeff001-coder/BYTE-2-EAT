import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

export const PRODUCT_SCAN1   = "com.owenskeffington.bite.scan1";
export const PRODUCT_SCAN10  = "com.owenskeffington.bite.scan10";
export const PRODUCT_SCAN30  = "com.owenskeffington.bite.scan30";

export type PurchasedProduct = typeof PRODUCT_SCAN1 | typeof PRODUCT_SCAN10 | typeof PRODUCT_SCAN30;

let _initialized = false;
const _unlockListeners = new Set<(productId: PurchasedProduct) => void>();

async function initStore() {
  if (_initialized) return;
  _initialized = true;
  try {
    const { store, ProductType, Platform } = await import("capacitor-plugin-cdv-purchase");
    store.register([
      { id: PRODUCT_SCAN1,  platform: Platform.APPLE_APPSTORE, type: ProductType.CONSUMABLE },
      { id: PRODUCT_SCAN10, platform: Platform.APPLE_APPSTORE, type: ProductType.CONSUMABLE },
      { id: PRODUCT_SCAN30, platform: Platform.APPLE_APPSTORE, type: ProductType.CONSUMABLE },
    ]);
    store.when().approved((transaction) => {
      transaction.finish();
      const id = transaction.products[0]?.id as PurchasedProduct | undefined;
      if (id) _unlockListeners.forEach((fn) => fn(id));
    });
    await store.initialize([Platform.APPLE_APPSTORE]);
  } catch {
    _initialized = false;
  }
}

export type IAPState = "idle" | "purchasing" | "restoring" | "success" | "error";

export function useIAP(onUnlock: (productId: PurchasedProduct) => void) {
  const [state, setState] = useState<IAPState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;
    const listener = (productId: PurchasedProduct) => {
      setState("success");
      onUnlockRef.current(productId);
    };
    _unlockListeners.add(listener);
    initStore();
    return () => {
      _unlockListeners.delete(listener);
    };
  }, [isNative]);

  const purchase = useCallback(async (productId: PurchasedProduct) => {
    if (!isNative) {
      setErrorMsg("In-app purchases are only available in the iOS app.");
      setState("error");
      return;
    }
    setState("purchasing");
    setErrorMsg(null);
    try {
      const { store, Platform } = await import("capacitor-plugin-cdv-purchase");
      const product = store.get(productId, Platform.APPLE_APPSTORE);
      const offer = product?.offers[0];
      if (!offer) throw new Error("Product unavailable — please try again shortly.");
      await offer.order();
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "Purchase failed. Please try again.");
    }
  }, [isNative]);

  const restore = useCallback(async () => {
    if (!isNative) {
      setErrorMsg("Restore purchases is only available in the iOS app.");
      setState("error");
      return;
    }
    setState("restoring");
    setErrorMsg(null);
    try {
      const { store } = await import("capacitor-plugin-cdv-purchase");
      await store.restorePurchases();
      setState("idle");
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "Restore failed. Please try again.");
    }
  }, [isNative]);

  const reset = useCallback(() => {
    setState("idle");
    setErrorMsg(null);
  }, []);

  return { purchase, restore, reset, state, errorMsg, isNative };
}

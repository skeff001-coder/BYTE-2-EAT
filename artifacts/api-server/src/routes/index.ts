import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeFridgeRouter from "./analyze-fridge";
import deleteAccountRouter from "./delete-account";
import supportRouter from "./support";
import searchRecipesRouter from "./search-recipes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeFridgeRouter);
router.use(deleteAccountRouter);
router.use(supportRouter);
router.use(searchRecipesRouter);

export default router;

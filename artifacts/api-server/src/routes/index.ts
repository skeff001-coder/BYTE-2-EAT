import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeFridgeRouter from "./analyze-fridge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeFridgeRouter);

export default router;

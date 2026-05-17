import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import skillsRouter from "./skills";
import projectsRouter from "./projects";
import certificatesRouter from "./certificates";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(skillsRouter);
router.use(projectsRouter);
router.use(certificatesRouter);
router.use(dashboardRouter);

export default router;

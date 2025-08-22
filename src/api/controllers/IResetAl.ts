import { IEntityController } from "./IEntityControllers";

export interface IResetAl extends IEntityController {
  resetAl(req: Request, res: Response): Promise<void>;
}

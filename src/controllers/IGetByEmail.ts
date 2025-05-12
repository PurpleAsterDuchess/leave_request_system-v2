import { IEntityController } from "./IEntityControllers";

export interface IGetByEmail extends IEntityController {
  getByEmail(req: Request, res: Response): Promise<void>;
}

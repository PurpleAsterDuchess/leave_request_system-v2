export interface ILoginController {
    login(req: Request, res: Response): Promise<void>
}
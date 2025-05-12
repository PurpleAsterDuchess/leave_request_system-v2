export interface IRouter {
    routeName: string;
    basePath: string;
    authenticate: boolean;

    getRouter(): IRouter;
}
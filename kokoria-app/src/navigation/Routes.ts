import { NavigatorScreenParams } from '@react-navigation/native';

// Enum for the root routes
export enum RootRoutes {
    AuthStack = 'AuthStack',
    MainTabs = 'MainTabs'
}

export enum AuthRoutes {
    Login = 'Login',
    Register = 'Register',
    ForgotPassword = 'ForgotPassword',
    VerifyEmail = 'VerifyEmail',
    ResetPassword = 'ResetPassword',
    VerifyCode = 'VerifyCode',
    VerifyPhone = 'VerifyPhone'
}

// Enum for the main routes
export enum MainRoutes {
    Home = 'Home',
    Store = 'Store',
    ProductDetails = 'ProductDetails',
    Category = 'Category',
    Cart = 'Cart',
    Checkout = 'Checkout',
    OrderDetails = 'OrderDetails',
    OrderHistory = 'OrderHistory',
    Profile = 'Profile',
    Settings = 'Settings',
    Notifications = 'Notifications',
    AddAddress = 'AddAddress',
    EditAddress = 'EditAddress'
}

// Type for the root stack param list
export type RootStackParamList = {
    [RootRoutes.AuthStack]: undefined;
    [RootRoutes.MainTabs]: undefined;
}

// Type for the auth stack param list
export type AuthStackParamList = {
    [AuthRoutes.Login]: undefined;
    [AuthRoutes.Register]: undefined;
    [AuthRoutes.ForgotPassword]: undefined;
    [AuthRoutes.VerifyEmail]: undefined;
    [AuthRoutes.ResetPassword]: undefined;
    [AuthRoutes.VerifyCode]: undefined;
    [AuthRoutes.VerifyPhone]: undefined;
}

export type MainTabParamList = {
    [MainRoutes.Home]:undefined;
    [MainRoutes.Store]:undefined;
    [MainRoutes.Cart]:undefined;
}

// Type for the main stack param list
export type MainStackParamList = {
    MainTabs:NavigatorScreenParams<MainTabParamList>;
    [MainRoutes.ProductDetails]:{productId:string};
    [MainRoutes.Category]:{categoryId:string};
    [MainRoutes.Cart]:undefined;
    [MainRoutes.Checkout]:undefined;
    [MainRoutes.OrderDetails]:{orderId:string};
    [MainRoutes.OrderHistory]:undefined;
    [MainRoutes.Profile]:undefined;
    [MainRoutes.Settings]:undefined;
    [MainRoutes.Notifications]:undefined;
    [MainRoutes.AddAddress]:undefined;
    [MainRoutes.EditAddress]:{addressId:string};
}
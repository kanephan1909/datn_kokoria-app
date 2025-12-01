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
    Home = 'Trang chủ',
    Order = 'Đơn Hàng',
    ProductDetails = 'Chi tiết sản phẩm',
    Category = 'Category',
    Cart = 'Giỏ hàng',
    Checkout = 'Thanh toán',
    OrderDetails = 'Chi tiết đơn hàng',
    OrderHistory = 'Lịch sử đơn hàng',
    Profile = 'Tôi',
    Settings = 'Cài đặt',
    Notifications = 'Thông báo',
    AddressList = 'Danh sách địa chỉ',
    AddAddress = 'Thêm địa chỉ',
    EditAddress = 'Sửa địa chỉ'
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
    [MainRoutes.Order]:undefined;
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
    [MainRoutes.AddressList]:undefined;
    [MainRoutes.AddAddress]:undefined;
    [MainRoutes.EditAddress]:{addressId:string};
}
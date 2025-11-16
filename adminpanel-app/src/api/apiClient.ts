import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {"Content-Type": "application/json"},
});


// Categories API
export const fetchCategories = async () => (await api.get('/categories')).data;
export const fetchCategory = async (id:string) => (await api.get(`/categories/${id}`)).data;
export const createCategory = async (data:{name:string,imageUrl?:string}) => (await api.post('/categories', data)).data;
export const updateCategory = async (id:string, data:{name:string,imageUrl?:string}) => (await api.put(`/categories/${id}`, data)).data;
export const deleteCategory = async (id:string) => (await api.delete(`/categories/${id}`)).data;

// Products API
export const fetchProductsByCategory = async (categoryId:string) => (await api.get(`/products?categoryId=${categoryId}`)).data;
export const fetchProductById = async (id:string) => (await api.get(`/products/${id}`)).data;
export const createProduct = async (data:{name:string,price:number,imageUrl?:string,description?:string,categoryId:string}) => (await api.post('/products', data)).data;
export const updateProduct = async (id:string, data:{name:string,price:number,imageUrl?:string,description?:string,categoryId:string}) => (await api.put(`/products/${id}`, data)).data;
export const deleteProduct = async (id:string) => (await api.delete(`/products/${id}`)).data;

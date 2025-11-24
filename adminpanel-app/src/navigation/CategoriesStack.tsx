import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CategoriesScreen from '../screens/CategoriesScreen'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AddCategoryScreen from '../screens/AddCategoryScreen'
import EditCategoryScreen from '../screens/EditCategoryScreen'

const Stack = createNativeStackNavigator();

const CategoriesStack = () => {
  return (
    <Stack.Navigator
    screenOptions={{
        headerStyle: {
            backgroundColor: 'tomato'
        },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
    }}
    >
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{title: 'Danh Mục Sản Phẩm'}}/>
      <Stack.Screen name="AddCategory" component={AddCategoryScreen} options={{title: 'Thêm Danh Mục Sản Phẩm'}}/>
<<<<<<< Updated upstream
      <Stack.Screen name="EditCategory" component={AddCategoryScreen} options={{title: 'Chỉnh Sửa Danh Mục'}}/>
=======
      <Stack.Screen name="EditCategory" component={EditCategoryScreen} options={{title: 'Chỉnh Sửa Danh Mục'}}/>
>>>>>>> Stashed changes
    </Stack.Navigator>
  )
}

export default CategoriesStack

const styles = StyleSheet.create({})
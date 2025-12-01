import {Image, Pressable, Text, View} from 'react-native';
import React from 'react';

export default function CategoryCard({
  name,
  image,
  onPress,
}: {
  name: string;
  image: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="mr-4" onPress={onPress}>
      <View className="bg-gray-200 w-28 h-28 rounded-2xl items-center justify-center p-2 shadow">
        <Image
          source={{uri: image}}
          resizeMode="cover"
          className="w-20 h-20 rounded-full"
        />
      </View>
      <Text className="text-sm text-gray-700 text-center mt-2 font-semibold w-28">
        {name}
      </Text>
    </Pressable>
  );
}

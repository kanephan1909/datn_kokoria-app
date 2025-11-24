import {Image, View, FlatList, NativeScrollEvent, NativeSyntheticEvent, LayoutChangeEvent} from 'react-native';
import React, {useRef, useState, useEffect} from 'react';

const banners = [
  {id: '1', image: require('../../assets/images/banner3.jpg')},
  {id: '2', image: require('../../assets/images/banner2.jpg')},
  {id: '3', image: require('../../assets/images/banner4.jpg')}, 
];

const BannerCarousel = () => {
  const flatListRef = useRef<FlatList>(null);
  const containerRef = useRef<View>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Lấy width thực tế từ container layout (chỉ đo 1 lần)
  const onContainerLayout = (event: LayoutChangeEvent) => {
    const {width} = event.nativeEvent.layout;
    if (width > 0 && containerWidth !== width) {
      setContainerWidth(width);
    }
  };

  // Item width và spacing
  const ITEM_SPACING = 12; // mr-3 = 12px
  const itemWidth = containerWidth;
  const itemWidthWithSpacing = itemWidth + ITEM_SPACING;

  useEffect(() => {
    if (itemWidth === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % banners.length;
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * itemWidthWithSpacing,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Auto scroll mỗi 4 giây

    return () => clearInterval(interval);
  }, [itemWidth, itemWidthWithSpacing]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (itemWidth === 0) {
      return;
    }
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / itemWidthWithSpacing);
    const clampedIndex = Math.max(0, Math.min(index, banners.length - 1));
    setCurrentIndex(clampedIndex);
  };

  const renderBanner = ({item}: {item: typeof banners[0]}) => {
    return (
      <View className="mr-3" style={{width: itemWidth || '100%'}}>
        <Image
          source={item.image}
          className="w-full h-[180px] rounded-2xl"
          resizeMode="cover"
        />
      </View>
    );
  };

  return (
    <View className="px-4 pt-4" ref={containerRef} onLayout={onContainerLayout}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={itemWidth > 0 ? itemWidthWithSpacing : undefined}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerClassName="pr-4"
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center items-center mt-3">
        {banners.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full mx-1 ${
              index === currentIndex ? 'w-6 bg-orange-500' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerCarousel;

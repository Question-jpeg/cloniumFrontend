import { Animated, Easing } from "react-native";

export const animate = (animatedValue: any, config: { toValue: number, duration: number, useNativeDriver?: Boolean, easing?: any }, callback?: any) => {
    if (!config['useNativeDriver'])
        config['useNativeDriver'] = true
    if (!config['easing'])
        config['easing'] = Easing.bezier(.14,.51,.26,1)
    Animated.timing(animatedValue, config as any).start(callback)
}
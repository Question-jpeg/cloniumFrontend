import * as Haptics from "expo-haptics";

export const makeMediumHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
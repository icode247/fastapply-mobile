import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="upload-resume" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}

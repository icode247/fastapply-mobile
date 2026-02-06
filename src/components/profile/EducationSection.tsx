import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../ui/Text";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { EducationItem } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface EducationSectionProps {
  education: EducationItem[];
  onChange: (education: EducationItem[]) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  onChange,
}) => {
  const { colors } = useTheme();

  const addEducation = () => {
    onChange([
      ...education,
      {
        school: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        location: "",
      },
    ]);
  };

  const removeEducation = (index: number) => {
    const updated = [...education];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateEducation = (
    index: number,
    field: keyof EducationItem,
    value: string
  ) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Education
        </Text>
        <Button title="Add" size="sm" variant="ghost" onPress={addEducation} />
      </View>

      {education.map((item, index) => (
        <View
          key={index}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              School #{index + 1}
            </Text>
            <TouchableOpacity onPress={() => removeEducation(index)}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          <Input
            label="School / Institution"
            value={item.school}
            onChangeText={(t) => updateEducation(index, "school", t)}
            placeholder="University of ..."
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Degree"
                value={item.degree}
                onChangeText={(t) => updateEducation(index, "degree", t)}
                placeholder="Bachelors"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Major/Field"
                value={item.major || item.fieldOfStudy}
                onChangeText={(t) => updateEducation(index, "major", t)}
                placeholder="Computer Science"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Start Date"
                value={item.startDate}
                onChangeText={(t) => updateEducation(index, "startDate", t)}
                placeholder="YYYY"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="End Date"
                value={item.endDate}
                onChangeText={(t) => updateEducation(index, "endDate", t)}
                placeholder="YYYY"
              />
            </View>
          </View>
        </View>
      ))}

      {education.length === 0 && (
        <Text
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            marginVertical: 10,
          }}
        >
          No education aded yet.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
  card: {
    padding: spacing[4],
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  cardTitle: {
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
  },
  halfInput: {
    flex: 1,
    marginRight: spacing[2],
  },
});

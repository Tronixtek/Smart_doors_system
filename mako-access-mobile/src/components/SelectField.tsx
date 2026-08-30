import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

export type SelectOption<T extends string = string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  value: T;
  /** NoInfer pins T to `value`, so a literal union isn't widened to string by these. */
  options: readonly SelectOption<NoInfer<T>>[];
  onChange: (value: NoInfer<T>) => void;
  /** Heading shown at the top of the option sheet. */
  title: string;
  /** Shown in the field when nothing is selected yet. */
  placeholder?: string;
  /** Shown inside the sheet when there are no options to choose from. */
  emptyText?: string;
  disabled?: boolean;
};

/**
 * A themed replacement for @react-native-picker/picker.
 *
 * The native Picker was unreadable on both platforms: on Android its dialog
 * follows the *system* theme (so our dark item colors vanished on dark-mode
 * phones), and on iOS the 216pt wheel was clipped by the 55pt field. This
 * renders the options in an app-owned sheet with explicit colors instead, so
 * it looks the same everywhere regardless of the OS theme.
 */
export default function SelectField<T extends string>({
  value,
  options,
  onChange,
  title,
  placeholder = 'Select an option',
  emptyText = 'Nothing to choose from yet.',
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const handleSelect = (option: SelectOption<T>) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => setOpen(true)}
        disabled={disabled || options.length === 0}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${selected ? selected.label : placeholder}`}
      >
        <Text
          style={[styles.fieldText, !selected && styles.fieldPlaceholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Theme.colors.textLight} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{title}</Text>
                  <TouchableOpacity
                    onPress={() => setOpen(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={22} color={Theme.colors.textLight} />
                  </TouchableOpacity>
                </View>

                {options.length === 0 ? (
                  <Text style={styles.emptyText}>{emptyText}</Text>
                ) : (
                  <ScrollView
                    style={styles.list}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                  >
                    {options.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.option, isSelected && styles.optionSelected]}
                          onPress={() => handleSelect(option)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={Theme.colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 55,
    paddingHorizontal: 15,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginRight: Theme.spacing.sm,
  },
  fieldPlaceholder: { fontWeight: '400', color: Theme.colors.textLight },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    maxHeight: '70%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
  },
  optionSelected: { backgroundColor: '#EEF2FF' },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginRight: Theme.spacing.sm,
  },
  optionTextSelected: { color: Theme.colors.primaryDark, fontWeight: '700' },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textLight,
    paddingVertical: Theme.spacing.lg,
    textAlign: 'center',
  },
});

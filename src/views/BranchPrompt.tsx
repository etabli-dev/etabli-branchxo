import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../state';
import { colors, fonts, radii, spacing } from '../ui';

export function BranchPromptModal() {
  const pending = useAppStore((s) => s.pendingBranch);
  const confirm = useAppStore((s) => s.confirmPendingBranch);
  const cancel = useAppStore((s) => s.cancelPendingBranch);

  return (
    <Modal transparent visible={pending !== null} animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Fork a new universe?</Text>
          <Text style={styles.body}>
            You scrubbed back to ply {pending?.atPly ?? '?'} and tapped a different cell. This will create
            a new universe branching from the current one. The original universe is preserved.
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={cancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel branch"
              style={[styles.btn, styles.btnGhost]}
            >
              <Text style={[styles.btnText, { color: colors.textDim }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm branch"
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={[styles.btnText, { color: colors.bg }]}>Branch</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panel,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...fonts.title, color: colors.text, marginBottom: spacing.sm },
  body: { ...fonts.body, color: colors.textDim, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  btn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnPrimary: { backgroundColor: colors.accent },
  btnText: { ...fonts.label },
});

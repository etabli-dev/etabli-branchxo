import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStrings } from '../i18n';
import { useAppStore } from '../state';
import { fonts, radii, spacing, useChrome } from '../ui';

export function BranchPromptModal() {
  const pending = useAppStore((s) => s.pendingBranch);
  const confirm = useAppStore((s) => s.confirmPendingBranch);
  const cancel = useAppStore((s) => s.cancelPendingBranch);
  const t = useStrings();
  const c = useChrome();

  return (
    <Modal transparent visible={pending !== null} animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]} accessibilityViewIsModal>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">{t.branchTitle}</Text>
          <Text style={[styles.body, { color: c.textDim }]}>{t.branchBody(pending?.atPly ?? '?')}</Text>
          <View style={styles.row}>
            <Pressable
              onPress={cancel}
              accessibilityRole="button"
              accessibilityLabel={t.cancelBranchA11y}
              testID="branch.cancel"
              style={[styles.btn, styles.btnGhost, { borderColor: c.border }]}
            >
              <Text numberOfLines={1} style={[styles.btnText, { color: c.text }]}>{t.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              accessibilityRole="button"
              accessibilityLabel={t.confirmBranchA11y}
              testID="branch.confirm"
              style={[styles.btn, { backgroundColor: c.accent }]}
            >
              <Text numberOfLines={1} style={[styles.btnText, { color: c.onAccent }]}>{t.branch}</Text>
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
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  title: { ...fonts.title, marginBottom: spacing.sm },
  body: { ...fonts.body, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  btn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md },
  btnGhost: { borderWidth: 1 },
  btnText: { ...fonts.label },
});

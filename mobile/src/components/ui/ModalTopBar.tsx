import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BackButton } from './BackButton';
import { colors, layout, space, type } from '@/theme/tokens';

type Props = {
  title: string;
  onBack: () => void;
  /** parchment = light screens; moss = dark overlay screens */
  tone?: 'parchment' | 'moss';
  /** Optional right-side control (keeps title centered) */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ModalTopBar({ title, onBack, tone = 'parchment', right, style }: Props) {
  const moss = tone === 'moss';
  return (
    <View style={[styles.bar, style]}>
      <BackButton onPress={onBack} tone={tone} />
      <Text style={[styles.title, moss && styles.titleMoss]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.slot}>{right ?? <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPad,
    paddingTop: space.xs,
    marginBottom: space.group,
    minHeight: layout.hitTarget,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: type.bodyBold,
    fontSize: type.size.base,
    color: colors.moss900,
    marginHorizontal: space.sm,
  },
  titleMoss: {
    color: colors.parchment,
    fontFamily: type.display,
    fontSize: type.size.lg,
  },
  slot: {
    width: layout.backSize,
    minWidth: layout.hitTarget,
    minHeight: layout.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: layout.backSize,
    height: layout.backSize,
  },
});

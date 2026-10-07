import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7 AM – 7 PM

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// Dependency-free date (and optional time) chooser: a strip of upcoming days, then hourly slots.
// value / onChange use an ISO string; '' means nothing picked yet.
export function DateTimeField({
  value,
  onChange,
  days = 14,
  withTime = true,
}: {
  value: string;
  onChange: (iso: string) => void;
  days?: number;
  withTime?: boolean;
}) {
  const picked = value ? new Date(value) : null;
  const dayList = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [days]);

  const pickDay = (day: Date) => {
    const next = new Date(day);
    next.setHours(withTime ? picked?.getHours() ?? 10 : 12, 0, 0, 0);
    onChange(next.toISOString());
  };

  const pickHour = (hour: number) => {
    const base = picked ? new Date(picked) : new Date(dayList[0]);
    base.setHours(hour, 0, 0, 0);
    onChange(base.toISOString());
  };

  const now = new Date();

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {dayList.map(day => {
          const active = picked != null && sameDay(day, picked);
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => pickDay(day)}
              style={[styles.dayChip, active && styles.chipActive]}>
              <Text style={[styles.dayWeek, active && styles.textActive]}>
                {day.toLocaleDateString('en-IN', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayNum, active && styles.textActive]}>{day.getDate()}</Text>
              <Text style={[styles.dayWeek, active && styles.textActive]}>
                {day.toLocaleDateString('en-IN', { month: 'short' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {withTime && picked ? (
        <View style={styles.slots}>
          {TIME_SLOTS.map(hour => {
            const slot = new Date(picked);
            slot.setHours(hour, 0, 0, 0);
            const past = slot <= now;
            const active = picked.getHours() === hour;
            return (
              <Pressable
                key={hour}
                disabled={past}
                onPress={() => pickHour(hour)}
                style={[styles.slot, active && styles.chipActive, past && styles.slotPast]}>
                <Text style={[styles.slotText, active && styles.textActive]}>
                  {slot.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    gap: 6,
  },
  dayChip: {
    width: 54,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  dayWeek: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  textActive: {
    color: colors.white,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slot: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  slotPast: {
    opacity: 0.35,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
});

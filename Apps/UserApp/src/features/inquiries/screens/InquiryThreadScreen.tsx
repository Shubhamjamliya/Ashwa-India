import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, CalendarClock, CheckCheck, CheckCircle2, Phone, Send, XCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useSocketEvents } from '../../../services/useSocketEvents';
import { dayLabel, fmtTime, money } from '../../../utils/format';
import type { HomeStackParamList } from '../../../navigation/types';
import { OfferPanel } from '../components/OfferPanel';
import { VisitRequestForm } from '../components/VisitRequestForm';
import type { Inquiry } from '../types';

type Rt = RouteProp<HomeStackParamList, 'InquiryThread'>;

// One conversation with a horse seller: price talk, visit request and the chat itself.
export function InquiryThreadScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rt>();
  const id = params.inquiryId;
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitSent, setVisitSent] = useState(false);
  const [answering, setAnswering] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const load = useCallback(
    () =>
      apiFetch<{ inquiry: Inquiry }>(`/marketplace/inquiries/${id}`)
        .then(d => setInquiry(d.inquiry))
        .catch(e => setError(e.message)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvents({
    'inquiry:message': (p: { inquiryId?: string }) => {
      if (p?.inquiryId === id) load();
    },
  });

  const answerQuote = async (action: 'accept' | 'decline') => {
    setAnswering(true);
    setError('');
    try {
      await apiFetch(`/marketplace/inquiries/${id}/quote`, { method: 'PATCH', body: { action } });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnswering(false);
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await apiFetch(`/marketplace/inquiries/${id}/messages`, { method: 'POST', body: { text: text.trim() } });
      setText('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const seller = inquiry?.seller?.businessName || inquiry?.seller?.name || 'Seller';
  const sellerPhone = inquiry?.seller?.phone;
  const messages = inquiry?.messages || [];
  let lastDay = '';

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <ArrowLeft color={colors.white} size={20} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{seller.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.headerName} numberOfLines={1}>
            {seller}
          </Text>
          {inquiry ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              About: {inquiry.horse?.name || inquiry.horse?.breed}
            </Text>
          ) : null}
        </View>
        {inquiry && !visitSent ? (
          <Pressable
            onPress={() => setVisitOpen(v => !v)}
            style={[styles.iconBtn, styles.iconBtnFill, visitOpen && styles.iconBtnGold]}>
            <CalendarClock color={colors.white} size={16} />
          </Pressable>
        ) : null}
        {sellerPhone ? (
          <Pressable
            onPress={() => Linking.openURL(`tel:${sellerPhone}`)}
            style={[styles.iconBtn, styles.iconBtnGreen]}>
            <Phone color={colors.white} size={16} />
          </Pressable>
        ) : null}
      </View>

      {!inquiry ? (
        error ? (
          <Text style={[styles.error, styles.pad]}>{error}</Text>
        ) : (
          <LoadingView />
        )
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topPanel}>
            <OfferPanel inquiry={inquiry} onChanged={load} />
            {visitSent ? (
              <Text style={styles.visitSent}>
                Visit request sent. The seller will confirm soon — check Visit requests for status.
              </Text>
            ) : null}
            {visitOpen && !visitSent && inquiry.horse?._id ? (
              <View style={styles.visitBox}>
                <Text style={styles.visitTitle}>Request a visit</Text>
                <VisitRequestForm
                  horseId={inquiry.horse._id}
                  onSent={() => {
                    setVisitSent(true);
                    setVisitOpen(false);
                  }}
                />
              </View>
            ) : null}
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.chat}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((m, i) => {
              const day = dayLabel(m.createdAt);
              const showDay = day !== lastDay;
              lastDay = day;
              const mine = m.sender === 'user';
              const isOffer = m.kind === 'offer';
              const isDeal = m.kind === 'deal';
              // Only the latest offer can still be answered, and only when it came from the seller.
              const canAnswer =
                isOffer &&
                i === messages.length - 1 &&
                !inquiry.agreedAmount &&
                inquiry.quote?.status === 'pending' &&
                inquiry.quote.by !== 'user';
              return (
                <View key={i}>
                  {showDay ? (
                    <View style={styles.dayWrap}>
                      <Text style={styles.day}>{day}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.bubbleRow, mine ? styles.end : styles.start]}>
                    <View
                      style={[
                        styles.bubble,
                        mine ? styles.bubbleMine : styles.bubbleTheirs,
                        isDeal && styles.bubbleDeal,
                      ]}>
                      {isOffer ? <Text style={styles.offerKicker}>Price offer</Text> : null}
                      {isDeal ? (
                        <View style={styles.dealRow}>
                          <CheckCheck color="#047857" size={14} />
                          <Text style={styles.dealKicker}>Deal</Text>
                        </View>
                      ) : null}
                      <Text style={styles.msgText}>{m.text}</Text>
                      <Text style={styles.msgTime}>{fmtTime(m.createdAt)}</Text>
                    </View>
                  </View>
                  {canAnswer ? (
                    <View style={[styles.answerRow, mine ? styles.end : styles.start]}>
                      <Pressable
                        disabled={answering}
                        onPress={() => answerQuote('accept')}
                        style={[styles.answerBtn, styles.answerNavy, answering && styles.disabled]}>
                        <CheckCircle2 color={colors.white} size={14} />
                        <Text style={styles.answerNavyText}>Accept {money(m.amount)}</Text>
                      </Pressable>
                      <Pressable
                        disabled={answering}
                        onPress={() => answerQuote('decline')}
                        style={[styles.answerBtn, styles.answerOutline, answering && styles.disabled]}>
                        <XCircle color={colors.foreground} size={14} />
                        <Text style={styles.answerOutlineText}>Decline</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={colors.mutedForeground}
              maxLength={1000}
              style={styles.input}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable
              onPress={send}
              disabled={sending || !text.trim()}
              style={[styles.sendBtn, (sending || !text.trim()) && styles.sendDisabled]}>
              <Send color={colors.white} size={16} />
            </Pressable>
          </View>
          {error ? <Text style={[styles.error, styles.errorBar]}>{error}</Text> : null}
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0, backgroundColor: '#ECE5D8' },
  flex: { flex: 1, minWidth: 0 },
  pad: { padding: spacing.lg, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconBtnFill: { backgroundColor: 'rgba(255,255,255,0.1)' },
  iconBtnGold: { backgroundColor: colors.primary },
  iconBtnGreen: { backgroundColor: '#059669' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.white },
  headerName: { fontSize: 15, fontWeight: '700', color: colors.white },
  headerSub: { fontSize: 11, color: colors.navyMuted },
  topPanel: {
    gap: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 12,
  },
  visitSent: { fontSize: 12, fontWeight: '600', color: '#047857' },
  visitBox: { gap: 8, backgroundColor: '#F6F3EC', borderRadius: radius.md, padding: 10 },
  visitTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 12, paddingVertical: spacing.md, gap: 6 },
  dayWrap: { alignItems: 'center', marginVertical: 10 },
  day: {
    fontSize: 11,
    fontWeight: '600',
    color: '#525252',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  bubbleRow: { flexDirection: 'row' },
  start: { justifyContent: 'flex-start' },
  end: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: '#DCF4E5', borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.card, borderBottomLeftRadius: 6 },
  bubbleDeal: { borderWidth: 1, borderColor: '#34D399' },
  offerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentForeground,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  dealKicker: { fontSize: 11, fontWeight: '700', color: '#047857', textTransform: 'uppercase' },
  msgText: { fontSize: 14, color: colors.foreground },
  msgTime: { fontSize: 10, color: colors.mutedForeground, textAlign: 'right', marginTop: 2 },
  answerRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  answerBtn: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  answerNavy: { backgroundColor: colors.navy },
  answerNavyText: { fontSize: 12, fontWeight: '700', color: colors.white },
  answerOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  answerOutlineText: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  disabled: { opacity: 0.5 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F3EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.foreground,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  error: { fontSize: 12, color: colors.destructive },
  errorBar: { backgroundColor: '#F6F3EC', paddingHorizontal: spacing.md, paddingBottom: 8 },
});

import React, {useState} from 'react';
import {Alert, Image, ScrollView, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import {useAuth} from '@/context/AuthContext';
import AboutCard from '@/components/settings/AboutCard';
import PrivacyPolicyModal from '@/components/settings/PrivacyPolicyModal';
import TermsModal from '@/components/settings/TermsModal';
import SectionLabel from '@/components/ui/SectionLabel';
import {GOLD, useThemeColors} from '@/hooks/useThemeColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuRow {
    icon: IoniconName;
    iconColor: string;
    iconBg: string;
    label: string;
    subtitle: string;
    onPress: () => void;
}

export default function AccountScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {user, personalInfo, logout} = useAuth();
    const t = useThemeColors();
    const [privacyVisible, setPrivacyVisible] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

    const displayName =
        personalInfo?.firstName && personalInfo?.lastName
            ? `${personalInfo.firstName} ${personalInfo.lastName}`
            : user?.name ?? user?.username ?? 'User';

    const avatarUrl = user?.profilePic?.url;
    const initials = displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    await logout();
                },
            },
        ]);
    };

    const MENU_ROWS: MenuRow[] = [
        {
            icon: 'person-outline',
            iconColor: GOLD,
            iconBg: GOLD + '20',
            label: 'Profile',
            subtitle: 'Manage your personal information',
            onPress: () => router.push('/profile'),
        },
        {
            icon: 'shield-checkmark-outline',
            iconColor: '#34d399',
            iconBg: '#34d39920',
            label: 'Security',
            subtitle: 'Password, sessions & account safety',
            onPress: () => router.push('/security'),
        },
        {
            icon: 'settings-outline',
            iconColor: '#60a5fa',
            iconBg: '#60a5fa20',
            label: 'Settings',
            subtitle: 'App preferences and configuration',
            onPress: () => router.push('/settings'),
        },
    ];

    return (
        <View className="flex-1" style={{paddingTop: insets.top, backgroundColor: t.bg}}>
            <ScrollView showsVerticalScrollIndicator={false}
                        contentContainerStyle={{paddingBottom: insets.bottom + 24}}>

                {/* ── Header ── */}
                <View className=" mt-0">
                    <SectionLabel title="Account" className={'px-6'}/>
                    {/* ── Profile card ── */}
                    <View className="mx-6 mb-6">
                        <View
                            className="rounded-2xl p-5 flex-row items-center gap-4"
                            style={{
                                backgroundColor: t.card,
                                borderWidth: 1,
                                borderColor: t.border,
                                shadowColor: '#000',
                                shadowOffset: {width: 0, height: 4},
                                shadowOpacity: 0.3,
                                shadowRadius: 12,
                                elevation: 5,
                            }}
                        >
                            {/* Avatar */}
                            {avatarUrl ? (
                                <Image
                                    source={{uri: avatarUrl}}
                                    className="rounded-full"
                                    style={{width: 60, height: 60}}
                                />
                            ) : (
                                <View
                                    className="rounded-full items-center justify-center"
                                    style={{
                                        width: 60,
                                        height: 60,
                                        backgroundColor: GOLD + '20',
                                        borderWidth: 1.5,
                                        borderColor: GOLD + '40'
                                    }}
                                >
                                    <Text className="font-bold text-lg" style={{color: GOLD}}>{initials}</Text>
                                </View>
                            )}

                            {/* Info */}
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2">
                                    <Text className="font-bold text-lg" numberOfLines={1}
                                          style={{color: t.text}}>{displayName}</Text>
                                    {user?.isVerified && (
                                        <Ionicons name="checkmark-circle" size={16} color="#22c55e"/>
                                    )}
                                </View>
                                <Text className="text-sm mt-0.5" numberOfLines={1}
                                      style={{color: t.textSub}}>@{user?.username}</Text>
                                {personalInfo?.profession ? (
                                    <Text className="text-xs mt-1" numberOfLines={1}
                                          style={{color: t.textMuted}}>{personalInfo.profession}</Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Divider label ── */}
                <View className=" mt-0">
                    <SectionLabel title="Menu" className={'px-6'}/>
                    {/* ── Menu rows ── */}
                    <View
                        className="mx-6 rounded-2xl overflow-hidden"
                        style={{
                            backgroundColor: t.card,
                            borderWidth: 1,
                            borderColor: t.border,
                            shadowColor: '#000',
                            shadowOffset: {width: 0, height: 4},
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            elevation: 4,
                        }}
                    >
                        {MENU_ROWS.map((row, i) => (
                            <TouchableOpacity
                                key={row.label}
                                onPress={row.onPress}
                                activeOpacity={0.7}
                                className="flex-row items-center px-5 py-4 gap-4"
                                style={i < MENU_ROWS.length - 1 ? {
                                    borderBottomWidth: 1,
                                    borderBottomColor: t.borderSub
                                } : undefined}
                            >
                                {/* Icon pill */}
                                <View
                                    className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
                                    style={{backgroundColor: row.iconBg}}
                                >
                                    <Ionicons name={row.icon} size={20} color={row.iconColor}/>
                                </View>

                                {/* Labels */}
                                <View className="flex-1">
                                    <Text className="font-semibold text-[15px]"
                                          style={{color: t.text}}>{row.label}</Text>
                                    <Text className="text-xs mt-0.5" style={{color: t.textMuted}}>{row.subtitle}</Text>
                                </View>

                                <Ionicons name="chevron-forward" size={16} color={t.border}/>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── About & Legal ── */}
                <View className="mx-6 mt-5">
                    <SectionLabel title="About & Legal"/>
                    <AboutCard
                        onPrivacyPress={() => setPrivacyVisible(true)}
                        onTermsPress={() => setTermsVisible(true)}
                    />
                </View>

                {/* ── Sign out ── */}
                <View className="mx-6 mt-2">
                    <TouchableOpacity
                        onPress={handleSignOut}
                        activeOpacity={0.8}
                        className="rounded-2xl flex-row items-center justify-center gap-3 py-4"
                        style={{backgroundColor: '#f8717110', borderWidth: 1, borderColor: '#f8717140'}}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#f87171"/>
                        <Text className="font-semibold text-[15px]" style={{color: '#f87171'}}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* ── App version ── */}
                <Text className="text-xs text-center mt-6" style={{color: t.textFaint}}>ResuCraft v1.0.0</Text>
            </ScrollView>

            <PrivacyPolicyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)}/>
            <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)}/>
        </View>
    );
}

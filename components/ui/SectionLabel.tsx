import React from 'react';
import {Text, View} from 'react-native';
import {useThemeColors} from '@/hooks/useThemeColors';

interface SectionLabelProps {
    title: string;
    className?: string;
}

export default function SectionLabel({title, className = ''}: SectionLabelProps) {
    const t = useThemeColors();
    return (<View className="mb-1 mt-2 px-0.5">

            <Text
                className={`text-md font-semibold uppercase tracking-widest mb-1 ${className}`}
                style={{color: t.textSub}}
            >
                {title}
            </Text>
    </View>
    );
}

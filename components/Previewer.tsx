import { View, Text, StyleSheet } from 'react-native';

// ── Helpers ───────────────────────────────────────────────────────────────────

const nestedToFlat = (nestedData: any) => {
    const elements: any[] = [...(nestedData.elements || [])];
    const sections: any[] = [];

    (nestedData.sections || []).forEach((section: any) => {
        const { 'sub-sections': subsections, elements: sectionElements, ...sectionData } = section;
        sections.push(sectionData);

        (sectionElements || []).forEach((el: any) => {
            elements.push({ ...el, x: el.x + section.x, y: el.y + section.y, parentSection: section.id });
        });

        (subsections || []).forEach((ss: any) => {
            const { elements: subEls, ...ssData } = ss;
            sections.push({ ...ssData, type: 'subsection', x: ssData.x + section.x, y: ssData.y + section.y, parentSection: section.id });
            (subEls || []).forEach((el: any) => {
                elements.push({ ...el, x: el.x + ssData.x + section.x, y: el.y + ssData.y + section.y, parentSection: ss.id });
            });
        });
    });

    return { elements, sections };
};

// ── Renderer ──────────────────────────────────────────────────────────────────

const TemplateRenderer = ({ data, scale }: { data: any; scale: number }) => {
    const { elements, sections } = nestedToFlat(data || {});

    const renderElement = (el: any, offsetX = 0, offsetY = 0) => {
        const left = (el.x - offsetX) * scale;
        const top = (el.y - offsetY) * scale;
        const width = el.width * scale;
        const height = el.height * scale;

        if (el.type === 'line-break') {
            return (
                <View
                    key={el.id}
                    style={{
                        position: 'absolute',
                        left,
                        top: top + height / 2,
                        width,
                        height: Math.max(1, (el.lineBreakThickness || 1) * scale),
                        backgroundColor: el.lineBreakColor || '#d1d5db',
                    }}
                />
            );
        }

        if (el.type === 'bullets') {
            const items: string[] = el.bulletItems || [];
            const columns: number = el.columns || 1;
            const bulletStyle: string = el.bulletStyle || 'disc';
            const fontSize = (el.fontSize || 12) * scale;
            const lineH = fontSize * (el.lineHeight || 1.5);

            const toRoman = (n: number): string => {
                const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
                const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
                let r = '';
                vals.forEach((v, i) => { while (n >= v) { r += syms[i]; n -= v; } });
                return r.toLowerCase();
            };

            const getMarker = (style: string, index: number): string => {
                switch (style) {
                    case 'disc':     return '\u2022';
                    case 'circle':   return '\u25CB';
                    case 'square':   return '\u25A0';
                    case 'dash':     return '\u2013';
                    case 'numbered': return `${index + 1}.`;
                    case 'roman':    return `${toRoman(index + 1)}.`;
                    case 'none':     return '';
                    default:         return '\u2022';
                }
            };

            // Chunk items into rows so we can simulate CSS grid columns
            const rows: string[][] = [];
            for (let i = 0; i < items.length; i += columns) {
                rows.push(items.slice(i, i + columns));
            }

            return (
                <View
                    key={el.id}
                    style={{ position: 'absolute', left, top, width, height, overflow: 'hidden' }}
                >
                    {rows.map((row, rowIdx) => (
                        <View
                            key={rowIdx}
                            style={{ flexDirection: 'row', marginBottom: 3 * scale }}
                        >
                            {row.map((item, colIdx) => {
                                const globalIdx = rowIdx * columns + colIdx;
                                return (
                                    <View
                                        key={colIdx}
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', paddingRight: colIdx < row.length - 1 ? 12 * scale : 0 }}
                                    >
                                        <Text style={{ fontSize, color: el.color || '#000000', fontFamily: el.fontFamily || undefined, lineHeight: lineH, marginRight: 5 * scale, flexShrink: 0 }}>
                                            {getMarker(bulletStyle, globalIdx)}
                                        </Text>
                                        <Text style={{ flex: 1, fontSize, fontWeight: (el.fontWeight || 'normal') as any, fontFamily: el.fontFamily || undefined, color: el.color || '#000000', lineHeight: lineH }} numberOfLines={0}>
                                            {item}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            );
        }

        return (
            <View
                key={el.id}
                style={{ position: 'absolute', left, top, width, height,  }}
            >
                <Text
                    style={{
                        fontSize: (el.fontSize || 16) * scale,
                        fontWeight: (el.fontWeight || 'normal') as any,
                        fontFamily: el.fontFamily || undefined,
                        color: el.color || '#000000',
                        textAlign: (el.textAlign || 'left') as any,
                        lineHeight: (el.fontSize || 16) * scale * (el.lineHeight || 1.5),
                    }}
                    numberOfLines={0}
                >
                    {el.content ?? ''}
                </Text>
            </View>
        );
    };

    const topLevelSections = sections.filter((s: any) => !s.parentSection);

    return (
        <>
            {topLevelSections.map((section: any) => {
                const subsections = sections.filter((s: any) => s.parentSection === section.id);
                const directEls = elements.filter(
                    (el: any) => el.parentSection === section.id && !subsections.some((ss: any) => ss.id === el.parentSection)
                );

                return (
                    <View
                        key={section.id}
                        style={{
                            position: 'absolute',
                            left: section.x * scale,
                            top: section.y * scale,
                            width: section.width * scale,
                            height: section.height * scale,
                        }}
                    >
                        {section.title && section.headerVisible !== false && (
                            <Text
                                style={{
                                    fontSize: (section.headerFontSize || 18) * scale,
                                    fontWeight: (section.headerFontWeight || '700') as any,
                                    fontFamily: section.headerFontFamily || undefined,
                                    color: section.headerColor || '#1f2937',
                                    marginBottom: 1 * scale,
                                }}
                            >
                                {section.title}
                            </Text>
                        )}

                        {subsections.map((ss: any) => (
                            <View
                                key={ss.id}
                                style={{
                                    position: 'absolute',
                                    left: (ss.x - section.x) * scale,
                                    top: (ss.y - section.y) * scale,
                                    width: ss.width * scale,
                                    height: ss.height * scale,
                                }}
                            >
                                {elements
                                    .filter((el: any) => el.parentSection === ss.id)
                                    .map((el: any) => renderElement(el, ss.x, ss.y))}
                            </View>
                        ))}

                        {directEls.map((el: any) => renderElement(el, section.x, section.y))}
                    </View>
                );
            })}

            {elements
                .filter((el: any) => !el.parentSection)
                .map((el: any) => renderElement(el))}
        </>
    );
};

// ── Previewer ─────────────────────────────────────────────────────────────────

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;

interface PreviewerProps {
    data: any;
    width: number;
}

const Previewer = ({ data, width }: PreviewerProps) => {
    const canvasWidth = data?.canvasSettings?.width
        ? parseFloat(data.canvasSettings.width) * MM_TO_PX
        : A4_WIDTH_MM * MM_TO_PX;
    const canvasHeight = data?.canvasSettings?.height
        ? parseFloat(data.canvasSettings.height) * MM_TO_PX
        : A4_HEIGHT_MM * MM_TO_PX;
    const scale = width / canvasWidth;
    const height = canvasHeight * scale;

    return (
        <View style={[styles.container, { width, height }]}>
            <TemplateRenderer data={data} scale={scale} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
});

export default Previewer;
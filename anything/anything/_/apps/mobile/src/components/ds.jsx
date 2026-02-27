import React, { useMemo } from "react";
import {
  View,
  Text as RNText,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Moon, Sun, Menu, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useTheme } from "../utils/theme.jsx";
import { useAuth } from "../utils/auth/useAuth";

const COMPANY = {
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
  email: "goldeyshvac@yahoo.com",
};

export function Text({ children, tone = "secondary", size = "base", style }) {
  const { tokens } = useTheme();

  const color = useMemo(() => {
    if (tone === "primary") return tokens.text.primary;
    if (tone === "tertiary") return tokens.text.tertiary;
    if (tone === "danger") return tokens.state.danger;
    if (tone === "inverse") return tokens.text.inverse;
    return tokens.text.secondary;
  }, [tone, tokens]);

  const fontSize = useMemo(() => {
    if (size === "xs") return 12;
    if (size === "sm") return 14;
    if (size === "lg") return 18;
    if (size === "xl") return 20;
    return 16;
  }, [size]);

  return (
    <RNText
      style={[
        { color, fontSize, lineHeight: Math.round(fontSize * 1.25) },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Heading({ children, level = 1, style }) {
  const { tokens } = useTheme();

  const fontSize = level === 1 ? 28 : level === 2 ? 22 : 18;
  const fontWeight = level === 1 ? "900" : level === 2 ? "800" : "700";

  return (
    <RNText
      style={[{ color: tokens.text.primary, fontSize, fontWeight }, style]}
    >
      {children}
    </RNText>
  );
}

export function Glass({ children, style }) {
  const { tokens } = useTheme();
  return (
    <BlurView
      intensity={tokens.glass.intensity}
      tint={tokens.glass.tint}
      style={[
        {
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: tokens.border.subtle,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  glass = false,
  style,
}) {
  const { tokens } = useTheme();

  const Container = glass ? Glass : View;
  const containerProps = glass
    ? {
        style: [
          {
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: tokens.border.subtle,
          },
          style,
        ],
      }
    : {
        style: [
          {
            backgroundColor: tokens.surface.primary,
            borderWidth: 1,
            borderColor: tokens.border.default,
            borderRadius: 18,
          },
          style,
        ],
      };

  return (
    <Container {...containerProps}>
      {title || right ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border.subtle,
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            {title ? <Heading level={2}>{title}</Heading> : null}
            {subtitle ? (
              <Text tone="tertiary" size="sm" style={{ marginTop: 6 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
      ) : null}

      <View style={{ padding: 16 }}>{children}</View>
    </Container>
  );
}

export function Button({
  children,
  onPress,
  disabled,
  variant = "primary",
  icon: Icon,
  iconOnly = false,
  style,
}) {
  const { tokens } = useTheme();

  const baseStyle = {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: iconOnly ? 0 : 18,
    width: iconOnly ? 44 : undefined,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  };

  const variantStyle =
    variant === "secondary"
      ? {
          backgroundColor: tokens.surface.primary,
          borderWidth: 1,
          borderColor: tokens.border.default,
        }
      : variant === "glass"
        ? {
            backgroundColor: "transparent",
          }
        : {
            backgroundColor: tokens.text.primary,
          };

  const textColor =
    variant === "secondary" ? tokens.text.primary : tokens.text.inverse;

  const content = (
    <View
      style={[
        baseStyle,
        variantStyle,
        style,
        disabled ? { opacity: 0.5 } : null,
      ]}
    >
      {Icon ? <Icon size={18} color={textColor} /> : null}
      {iconOnly ? null : (
        <RNText style={{ color: textColor, fontWeight: "800" }}>
          {children}
        </RNText>
      )}
    </View>
  );

  if (variant === "glass") {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        <Glass style={[{ width: iconOnly ? 44 : undefined }, style]}>
          {content}
        </Glass>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export function ThemeToggle({ variant = "secondary" }) {
  const { theme, toggleTheme, tokens } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Light" : "Dark";

  return (
    <Button
      onPress={toggleTheme}
      variant={variant}
      icon={Icon}
      style={{ paddingHorizontal: 14, height: 40 }}
    >
      {label}
    </Button>
  );
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  style,
}) {
  const { tokens } = useTheme();

  const input = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={tokens.text.tertiary}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      style={[
        {
          height: 44,
          borderRadius: 14,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: tokens.border.default,
          backgroundColor: tokens.surface.primary,
          color: tokens.text.primary,
        },
        style,
      ]}
    />
  );

  if (!label) {
    return input;
  }

  return (
    <View>
      <Text tone="tertiary" size="xs" style={{ fontWeight: "800" }}>
        {label}
      </Text>
      <View style={{ marginTop: 8 }}>{input}</View>
    </View>
  );
}

export function Select({ label, value, options, onChange, style }) {
  const { tokens } = useTheme();
  const safeOptions = options || [];

  return (
    <View style={style}>
      {label ? (
        <Text tone="tertiary" size="xs" style={{ fontWeight: "800" }}>
          {label}
        </Text>
      ) : null}
      <View style={{ marginTop: label ? 10 : 0, gap: 8 }}>
        {safeOptions.map((opt) => {
          const selected = value === opt.value;
          const borderColor = selected
            ? tokens.brand.primary
            : tokens.border.default;
          const backgroundColor = selected
            ? tokens.bg.tertiary
            : tokens.surface.primary;

          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange?.(opt.value)}
              style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
            >
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor,
                  backgroundColor,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text tone="primary" style={{ fontWeight: "800" }}>
                  {opt.label}
                </Text>
                {selected ? (
                  <View
                    style={{
                      height: 10,
                      width: 10,
                      borderRadius: 999,
                      backgroundColor: tokens.brand.primary,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      height: 10,
                      width: 10,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: tokens.border.default,
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Table({ columns, rows }) {
  const { tokens } = useTheme();
  const safeColumns = columns || [];
  const safeRows = rows || [];

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: tokens.border.default,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: tokens.surface.primary,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border.subtle,
          flexDirection: "row",
        }}
      >
        {safeColumns.map((c) => (
          <View key={c.key} style={{ flex: 1 }}>
            <Text tone="tertiary" size="xs" style={{ fontWeight: "800" }}>
              {c.header}
            </Text>
          </View>
        ))}
      </View>

      {safeRows.map((r, idx) => (
        <View
          key={r.id || idx}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: tokens.surface.primary,
            borderBottomWidth: idx === safeRows.length - 1 ? 0 : 1,
            borderBottomColor: tokens.border.subtle,
            flexDirection: "row",
          }}
        >
          {safeColumns.map((c) => {
            const val = r[c.key];
            const content = c.render ? c.render(r) : val;
            return (
              <View key={c.key} style={{ flex: 1 }}>
                <Text tone="secondary">{content}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function ThemeModeSelect({ style }) {
  const { mode, setMode } = useTheme();

  const options = useMemo(
    () => [
      { value: "system", label: "System" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
    [],
  );

  return (
    <Select
      style={style}
      label="Appearance"
      value={mode}
      options={options}
      onChange={(v) => setMode(v)}
    />
  );
}

export function Page({
  title,
  subtitle,
  children,
  scroll = true,
  headerLeft,
  headerRight,
  contentContainerStyle,
  brandHeader = true,
}) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const router = useRouter();
  const { isReady, isAuthenticated, signIn, signOut, auth } = useAuth();

  const [menuOpen, setMenuOpen] = React.useState(false);

  const LOGO = {
    url: "https://ucarecdn.com/416ac318-a7cf-4388-8d8c-6378c7ceb973/-/format/auto/",
    alt: "Goldey's Heating & Cooling",
  };

  const role = auth?.user?.role || null;
  const isAdmin = role === "admin" || role === "owner";

  const navItems = useMemo(() => {
    if (isAdmin) {
      return [
        { label: "Schedule", href: "/(tabs)/schedule" },
        { label: "Accounting", href: "/(tabs)/accounting" },
        { label: "Map", href: "/(tabs)/map" },
        { label: "Settings", href: "/(tabs)/settings" },
      ];
    }

    return [
      { label: "Home", href: "/(tabs)/home" },
      { label: "Emergency", href: "/(tabs)/emergency" },
      { label: "Schedule", href: "/(tabs)/schedule" },
      { label: "My Account", href: "/(tabs)/account" },
    ];
  }, [isAdmin]);

  const menuOverlay =
    brandHeader && menuOpen ? (
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          elevation: 50,
        }}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 320,
            maxWidth: "85%",
            backgroundColor: tokens.surface.primary,
            borderLeftWidth: 1,
            borderLeftColor: tokens.border.default,
          }}
        >
          <View
            style={{
              paddingTop: insets.top,
              paddingHorizontal: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: tokens.border.subtle,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Text tone="primary" style={{ fontWeight: "900" }}>
              Menu
            </Text>
            <Button
              onPress={() => setMenuOpen(false)}
              variant="secondary"
              icon={X}
              iconOnly
            />
          </View>

          <View style={{ padding: 12, gap: 10 }}>
            {navItems.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(item.href);
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
              >
                <View
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: tokens.border.default,
                    backgroundColor: tokens.surface.primary,
                  }}
                >
                  <Text tone="primary" style={{ fontWeight: "800" }}>
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            ))}

            <View
              style={{
                marginTop: 6,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: tokens.border.subtle,
                gap: 10,
              }}
            >
              {isReady && isAuthenticated ? (
                <Button
                  onPress={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  variant="secondary"
                >
                  Sign out
                </Button>
              ) : (
                <Button
                  onPress={() => {
                    setMenuOpen(false);
                    signIn();
                  }}
                  variant="secondary"
                >
                  Sign in
                </Button>
              )}
            </View>
          </View>
        </View>
      </View>
    ) : null;

  const header = brandHeader ? (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border.subtle,
        backgroundColor: tokens.surface.primary,
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 12,
      }}
    >
      {/* Left: contact info (flexes; can shrink on small screens) */}
      <View style={{ flex: 1, alignItems: "flex-start", paddingRight: 6 }}>
        {headerLeft ? (
          <View style={{ marginBottom: 8 }}>{headerLeft}</View>
        ) : null}

        <Pressable
          onPress={() => Linking.openURL(COMPANY.phoneHref)}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Text tone="primary" size="xs" style={{ fontWeight: "900" }}>
            {COMPANY.phoneDisplay}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(`mailto:${COMPANY.email}`)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
            marginTop: 2,
          })}
        >
          <Text tone="tertiary" size="xs" style={{ fontWeight: "700" }}>
            {COMPANY.email}
          </Text>
        </Pressable>
      </View>

      {/* Center: logo + optional title/subtitle (fixed width keeps it centered) */}
      <View style={{ width: 170, alignItems: "center" }}>
        <Image
          source={{ uri: LOGO.url }}
          accessibilityLabel={LOGO.alt}
          style={{ width: 150, height: 40 }}
          contentFit="contain"
          transition={100}
        />

        {title ? (
          <Text
            tone="primary"
            size="sm"
            style={{ marginTop: 6, fontWeight: "900", textAlign: "center" }}
          >
            {title}
          </Text>
        ) : null}

        {subtitle ? (
          <Text
            tone="tertiary"
            size="xs"
            style={{ marginTop: 4, fontWeight: "700", textAlign: "center" }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right: actions + hamburger (flexes; stays right aligned) */}
      <View
        style={{
          flex: 1,
          alignItems: "flex-end",
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        {headerRight}
        <Button
          onPress={() => setMenuOpen(true)}
          variant="secondary"
          icon={Menu}
          iconOnly
        />
      </View>
    </View>
  ) : (
    <View style={{ paddingTop: insets.top }} />
  );

  // --- EXISTING BEHAVIOR: page body ---
  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg.secondary }}>
        {header}
        <View
          style={[
            {
              flex: 1,
              padding: 16,
              paddingBottom: insets.bottom + 24,
            },
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
        {menuOverlay}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg.secondary }}>
      {header}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            padding: 16,
            paddingBottom: insets.bottom + 24,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {menuOverlay}
    </View>
  );
}

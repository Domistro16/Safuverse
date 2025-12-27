import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/ThemeContext';

interface WalletOption {
    id: string;
    name: string;
    icon: string;
    description: string;
    available: boolean;
}

interface WalletSelectModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectWallet: (walletId: string) => void;
    isConnecting: boolean;
    connectingWallet: string | null;
}

const WALLET_OPTIONS: WalletOption[] = [
    {
        id: 'metamask',
        name: 'MetaMask',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
        description: 'Connect using browser extension',
        available: Platform.OS === 'web',
    },
    {
        id: 'trustwallet',
        name: 'Trust Wallet',
        icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
        description: 'Connect using Trust Wallet',
        available: Platform.OS === 'web',
    },
    {
        id: 'walletconnect',
        name: 'WalletConnect',
        icon: 'https://avatars.githubusercontent.com/u/37784886',
        description: 'Scan with mobile wallet',
        available: true,
    },
    {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: 'https://avatars.githubusercontent.com/u/18060234',
        description: 'Connect using Coinbase',
        available: Platform.OS === 'web',
    },
];

export const WalletSelectModal: React.FC<WalletSelectModalProps> = ({
    visible,
    onClose,
    onSelectWallet,
    isConnecting,
    connectingWallet,
}) => {
    const { colors } = useTheme();

    const availableWallets = WALLET_OPTIONS.filter((w) => w.available);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Connect Wallet
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Choose your preferred wallet to connect
                    </Text>

                    {/* Wallet Options */}
                    <View style={styles.walletsContainer}>
                        {availableWallets.map((wallet) => (
                            <TouchableOpacity
                                key={wallet.id}
                                style={[
                                    styles.walletOption,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => onSelectWallet(wallet.id)}
                                disabled={isConnecting}
                            >
                                <View style={styles.walletIcon}>
                                    {wallet.icon.startsWith('http') ? (
                                        <Image
                                            source={{ uri: wallet.icon }}
                                            style={styles.iconImage}
                                        />
                                    ) : (
                                        <Ionicons
                                            name="wallet-outline"
                                            size={32}
                                            color={colors.primary}
                                        />
                                    )}
                                </View>
                                <View style={styles.walletInfo}>
                                    <Text style={[styles.walletName, { color: colors.text }]}>
                                        {wallet.name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.walletDescription,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {wallet.description}
                                    </Text>
                                </View>
                                {isConnecting && connectingWallet === wallet.id ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer */}
                    <Text style={[styles.footer, { color: colors.textSecondary }]}>
                        By connecting, you agree to our Terms of Service
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        ...Platform.select({
            web: {
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 30,
                elevation: 10,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    closeButton: {
        padding: 4,
    },
    description: {
        fontSize: 14,
        marginBottom: 24,
    },
    walletsContainer: {
        gap: 12,
    },
    walletOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    iconImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    walletInfo: {
        flex: 1,
    },
    walletName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    walletDescription: {
        fontSize: 13,
    },
    footer: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default WalletSelectModal;

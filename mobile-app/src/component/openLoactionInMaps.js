import { Alert, Linking, Platform } from 'react-native';

export default async function openLocationInMaps(shop) {
    
    const coordinates = shop.location?.coordinates;
    const longitude = coordinates?.[0];
    const latitude = coordinates?.[1];
    const address = `${shop.address?.street}, ${shop.address?.city}, ${shop.address?.state} ${shop.address?.pincode}`;

    if (latitude && longitude) {
        // Use coordinates if available
        const url = Platform.select({
            ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
            android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(shop.shopName || 'Shop Location')})`,
            default: `https://www.google.com/maps/@${latitude},${longitude},17z`,
        });

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Fallback to web URL
                await Linking.openURL(`https://www.google.com/maps/@${latitude},${longitude},17z`);
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to open maps application');
        }
    } else {
        // Use address if coordinates not available
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Error', 'Unable to open maps');
        }
    }
}
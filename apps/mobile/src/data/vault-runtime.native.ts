import * as Crypto from 'expo-crypto';import {configureVaultCrypto} from '@life-os/domain/vault';import {portableVaultCrypto} from '@life-os/domain/vault-crypto';
configureVaultCrypto(portableVaultCrypto(length=>new Uint8Array(Crypto.getRandomBytes(length))));

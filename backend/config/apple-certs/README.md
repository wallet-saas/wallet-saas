# Certificats Apple Wallet

Placer ici les 3 fichiers de certificats pour activer Apple Wallet :

| Fichier           | Description                                          |
|-------------------|------------------------------------------------------|
| `signerCert.pem`  | Certificat du Pass Type ID                           |
| `signerKey.pem`   | Clé privée associée au certificat                    |
| `wwdr.pem`        | Apple Worldwide Developer Relations Certificate      |

## Instructions

1. Acheter un compte Apple Developer : https://developer.apple.com (99$/an)
2. Créer un **Pass Type ID** : `pass.com.stamply.loyalty`
3. Générer les certificats depuis le portail Apple Developer
4. Exporter en `.pem` et placer ici
5. Ajouter dans `backend/.env` :
   ```
   APPLE_TEAM_ID=XXXXXXXXXX
   APPLE_PASS_TYPE_ID=pass.com.stamply.loyalty
   APPLE_CERT_PATH=./config/apple-certs
   ```

## Guide détaillé

https://developer.apple.com/wallet/get-started/

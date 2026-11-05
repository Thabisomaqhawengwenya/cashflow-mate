import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { AppLogo } from '@/components/BrandLogos';
import { M3Badge } from '@/components/M3/M3Badge';
import { useAppearance } from '@/context/AppearanceContext';

type LegalTab = 'terms' | 'privacy';

export default function LegalScreen() {
  const { palette, surfaces, cardRadius } = useAppearance();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: LegalTab = params.tab === 'privacy' ? 'privacy' : 'terms';
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  return (
    <View style={[styles.container, { backgroundColor: palette.headerBg }]}>
      {/* Header Canvas */}
      <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Legal & Trust Center</Text>
            <Text style={[styles.headerSubtitle, { color: palette.accent }]}>20-Point Compliance & Data Safeguards</Text>
          </View>

          <View style={styles.placeholderButton} />
        </View>

        {/* Brand Bar */}
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <Text style={styles.brandName}>CashFlow Mate</Text>
            <Text style={[styles.brandBadge, { color: palette.accent }]}>VERIFIED COMPLIANCE • MIT LICENSED</Text>
          </View>
        </View>

        {/* Clean 2-Way Document Switcher (Squircle, No Pills) */}
        <View style={styles.segmentContainer}>
          <Pressable
            onPress={() => setActiveTab('terms')}
            style={[
              styles.segmentBtn,
              activeTab === 'terms' && {
                backgroundColor: palette.primary,
                borderColor: palette.accent,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'terms' }}
          >
            <Ionicons
              name="document-text"
              size={15}
              color={activeTab === 'terms' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'terms' && styles.segmentBtnTextActive,
              ]}
            >
              Terms of Service
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('privacy')}
            style={[
              styles.segmentBtn,
              activeTab === 'privacy' && {
                backgroundColor: palette.primary,
                borderColor: palette.accent,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'privacy' }}
          >
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={activeTab === 'privacy' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'privacy' && styles.segmentBtnTextActive,
              ]}
            >
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sheet Content Canvas */}
      <ScrollView
        style={[styles.sheet, { backgroundColor: surfaces.sheetBg }]}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'privacy' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="CYBER & DATA PROTECTION ACT [12:07]" variant="mint" />
              <M3Badge label="LOCAL-FIRST OFFLINE" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>CashFlow Mate – Privacy Policy</Text>
            <Text style={[styles.bodyParagraph, { fontWeight: '600', color: '#64748B', marginBottom: 14 }]}>
              Last updated: 4 November 2026 &bull; Effective date: 4 November 2026
            </Text>

            <Text style={styles.subHeading}>1. Who we are and what this covers</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate (the “App”) is a recordkeeping and cash-flow tool for small traders, made by <Text style={styles.boldText}>Maqhawe T Ngwenya</Text> (“we”, “us”, “our”). This policy explains what personal information the App handles, why, where it is kept, who can see it, and what choices you have. It applies to the Android app (package com.maqhawe.cashflowmate), the web version and any related services we run.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 8 }]}>
              We are the “data controller” for information we receive through our own servers. For records you keep only on your own device, you are in control of them, and we do not see them.
            </Text>

            <Text style={styles.subHeading}>2. The short version</Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>The App is built to work mostly on your device.</Text> Your till records are stored on your phone unless you choose to use cloud features or the web version.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; We do not sell your data and we do not show advertising.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; The App does not automatically read your SMS inbox, contacts or location. You paste or import the information you want to record.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; AI features are optional. If you use them, some business figures are sent to Google to produce an answer.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; You can export, correct and delete your records, and you can ask us to delete anything we hold.
            </Text>

            <Text style={styles.subHeading}>3. Information the App handles</Text>
            <Text style={[styles.bodyParagraph, { fontWeight: '700', color: '#0A192F', marginTop: 4 }]}>Account and profile</Text>
            <Text style={styles.bulletItem}>
              &bull; Name, username, email address and phone number, city, business name, stall number, merchant till number, operating hours and a short tagline.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; A profile picture, only if you choose one.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Your password. On our servers it is stored only as a one-way hash, not in readable form.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Your till PIN, if you set one. It is stored on your device as a hash.
            </Text>

            <Text style={[styles.bodyParagraph, { fontWeight: '700', color: '#0A192F', marginTop: 8 }]}>Business records you create or import</Text>
            <Text style={styles.bulletItem}>
              &bull; Transactions: amounts, dates, currencies, descriptions, references, counterparty names, categories and notes.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Cash drawers and accounts (for example cash, EcoCash, InnBucks and bank).
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Customer credit and supplier debts, which can include names, phone numbers, amounts owed and repayments.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Inventory, invoices, contacts and receipts, if you use those features.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; CSV files you import and SMS text you paste in so the App can read it.
            </Text>

            <Text style={[styles.bodyParagraph, { fontWeight: '700', color: '#0A192F', marginTop: 8 }]}>Settings</Text>
            <Text style={styles.bulletItem}>
              &bull; Your language, currency and exchange-rate settings, and your own Google Gemini API key if you add one.
            </Text>

            <Text style={[styles.bodyParagraph, { fontWeight: '700', color: '#0A192F', marginTop: 8 }]}>Information about other people</Text>
            <Text style={styles.bulletItem}>
              &bull; Customers, suppliers and, if you use the reporting features, people you report for suspected fraud (name, phone number, ID or reference number, and what happened). See section 11.
            </Text>

            <Text style={[styles.bodyParagraph, { fontWeight: '700', color: '#0A192F', marginTop: 8 }]}>Support and technical information</Text>
            <Text style={styles.bulletItem}>
              &bull; Messages you send to support.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; When you connect to our servers, basic technical information such as your IP address, device or browser type, and error and request logs.
            </Text>

            <Text style={[styles.bodyParagraph, { fontWeight: '700', color: '#0A192F', marginTop: 8 }]}>What we do not collect</Text>
            <Text style={styles.bulletItem}>
              &bull; We do not read your SMS inbox automatically, access your contact list, or collect your location or advertising identifiers.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; We do not process your payments or hold your money, and we do not connect to your EcoCash, InnBucks or bank accounts.
            </Text>

            <Text style={styles.subHeading}>4. Where your data is stored</Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>On your device (default):</Text> In the mobile app, your records are stored in the App’s local storage on your phone. We cannot see or recover them. If you lose the phone or clear the App’s data without a backup, they may be gone.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>On our servers (web version and optional cloud sync):</Text> If you use the web version, or turn on cloud sync where it is offered, your account and records are stored in our database and are tied to your account so other users cannot see them.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Backups you make:</Text> The App can export your records to a backup file. These files are not encrypted by the App, so please store them somewhere safe.
            </Text>

            <Text style={styles.subHeading}>5. How we use your information</Text>
            <Text style={styles.bodyParagraph}>
              We use it to create and run your account and show you your records, totals and reports; read, categorise and de-duplicate the SMS text and CSV files you import; provide optional AI explanations and suggestions; check licence keys and unlock paid features; keep the App secure, fix errors and answer support requests; and meet our legal duties. We do not use your records to build advertising profiles.
            </Text>

            <Text style={styles.subHeading}>6. AI features and Google Gemini</Text>
            <Text style={styles.bodyParagraph}>
              If you use the AI features:
            </Text>
            <Text style={styles.bulletItem}>
              &bull; The App sends a question and a set of figures to Google’s Gemini service. These can include totals, category breakdowns and, depending on the feature, recent transactions, debts and drawer balances.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Where the App asks for your own Gemini API key, requests are made with your key and are subject to your agreement with Google. In the web version, requests may go through our server.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Our web and server versions are designed to remove phone numbers and identity details before sending data to AI services. Even so, please avoid typing personal details about customers into AI questions.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; How Google handles the data is governed by Google’s own terms and privacy notices.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 6, fontWeight: '600' }]}>
              AI is optional. If you never turn it on, none of your records are sent to Google.
            </Text>

            <Text style={styles.subHeading}>7. Who we share information with</Text>
            <Text style={styles.bodyParagraph}>
              We do not sell your personal information. We share it only with:
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Service providers</Text> that help us run the App, such as hosting and storage providers, Google (for AI), and app distribution and build services (for example Expo and app stores). They may only use it to provide their service to us;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Authorities or courts,</Text> when we are legally required to, or need to protect rights, safety or security;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>A buyer or successor,</Text> if the App or our business is transferred, in which case this policy will continue to protect your data or you will be told of any change.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 6 }]}>
              We do not share your records with EcoCash, InnBucks, banks or other traders.
            </Text>

            <Text style={styles.subHeading}>8. Our legal basis</Text>
            <Text style={styles.bodyParagraph}>
              We process personal information under Zimbabwe’s Cyber and Data Protection Act [Chapter 12:07] and similar rules, relying on your consent (e.g. AI or cloud features, profile photo), performing our agreement with you, legitimate interests (keeping the App secure, preventing licence misuse), and statutory legal obligations. You can withdraw consent at any time by turning the feature off or deleting your data.
            </Text>

            <Text style={styles.subHeading}>9. How long we keep information</Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Records on your device</Text> stay there until you delete them or uninstall the App.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Records on our servers</Text> stay while your account is active. If you ask us to delete your account, we will delete or anonymise your data within <Text style={styles.boldText}>30 days</Text>, except where we must keep something by law.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Server logs</Text> are kept for <Text style={styles.boldText}>90 days</Text>, then deleted.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Support messages</Text> are kept for <Text style={styles.boldText}>12 months</Text> after the issue is resolved.
            </Text>

            <Text style={styles.subHeading}>10. Keeping your information safe</Text>
            <Text style={styles.bodyParagraph}>
              We use protections such as hashed passwords, signed login tokens, separation of each business’s data on the server, file-size and file-type limits on uploads, an optional till PIN with lock-out after repeated wrong attempts, and a privacy mask that hides figures on screen. No app or network is perfectly secure. You can help by using a strong password and PIN, locking your phone, keeping the App updated and protecting your backup files. If we learn of a breach that affects you, we will notify you and the authorities as the law requires.
            </Text>

            <Text style={styles.subHeading}>11. Information about customers, suppliers and reported individuals</Text>
            <Text style={styles.bodyParagraph}>
              When you enter someone else’s details, you are responsible for having a good reason to hold them and for treating them fairly and lawfully. Collect only what you need, keep it accurate, and delete it when you no longer need it. If you use the reporting features, record only facts you honestly believe to be true; do not include national ID numbers or other sensitive details unless truly necessary; and remember that false or careless statements about a person can have legal consequences for you.
            </Text>

            <Text style={styles.subHeading}>12. Your rights</Text>
            <Text style={styles.bodyParagraph}>
              Subject to the law, you can:
            </Text>
            <Text style={styles.bulletItem}>
              &bull; see and get a copy of your personal information (the App can export your records as CSV or a backup file);
            </Text>
            <Text style={styles.bulletItem}>
              &bull; correct information that is wrong;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; ask us to delete your information;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; object to or limit certain processing, and withdraw consent;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; complain to the <Text style={styles.boldText}>Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ)</Text>, which is the data protection authority, if you think we have mishandled your information.
            </Text>

            <Text style={styles.subHeading}>13. Transfers outside Zimbabwe</Text>
            <Text style={styles.bodyParagraph}>
              Some providers we use, including Google and cloud hosts, may process data on servers outside Zimbabwe. When that happens, we take reasonable steps to make sure your information is protected to a similar standard, as the law requires.
            </Text>

            <Text style={styles.subHeading}>14. Children</Text>
            <Text style={styles.bodyParagraph}>
              The App is not meant for anyone under 18, and we do not knowingly collect information from children. If you think a child has given us personal information, please contact us and we will delete it.
            </Text>

            <Text style={styles.subHeading}>15. Contact us</Text>
            <Text style={styles.bodyParagraph}>
              Questions, requests or complaints about this policy or your data:
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Data Controller:</Text>
              <Text style={styles.detailValue}>Maqhawe T Ngwenya</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Privacy Email:</Text>
              <Text style={styles.detailValue}>privacy@cashflowmate.app</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Location:</Text>
              <Text style={styles.detailValue}>Harare, Zimbabwe</Text>
            </View>

            <Text style={styles.subHeading}>16. Changes to this policy</Text>
            <Text style={styles.bodyParagraph}>
              We may update this policy when the App or the law changes. We will change the date at the top and, for significant changes, tell you in the App or by another reasonable method.
            </Text>
          </View>
        )}

        {activeTab === 'terms' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="MIT OPEN SOURCE" variant="mint" />
              <M3Badge label="BINDING AGREEMENT" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>CashFlow Mate – Terms and Conditions</Text>
            <Text style={[styles.bodyParagraph, { fontWeight: '600', color: '#64748B', marginBottom: 14 }]}>
              Last updated: 4 November 2026 &bull; Effective date: 4 November 2026
            </Text>

            <Text style={styles.subHeading}>1. About these Terms</Text>
            <Text style={styles.bodyParagraph}>
              These Terms and Conditions (“Terms”) are an agreement between you and <Text style={styles.boldText}>Maqhawe T Ngwenya</Text> (“we”, “us”, “our”), the maker of CashFlow Mate (the “App”). The App includes the Android app (package com.maqhawe.cashflowmate), the web version, and any related services we run.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 8 }]}>
              By creating an account, entering the demo, installing the App or using it in any way, you agree to these Terms. If you do not agree, please do not use the App.
            </Text>

            <Text style={styles.subHeading}>2. Who may use the App</Text>
            <Text style={styles.bodyParagraph}>
              You must be at least 18 years old, or have the permission of a parent or guardian, and be able to enter a binding agreement. The App is designed for small traders and microbusinesses, but you may also use it for personal money tracking.
            </Text>

            <Text style={styles.subHeading}>3. What the App is, and what it is not</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate is a recordkeeping and decision-support tool. It helps you record sales, expenses, mobile money and bank movements, customer credit and supplier debts, and see summaries such as cash flow and an estimated operating profit.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 8, fontWeight: '700' }]}>The App is not:</Text>
            <Text style={styles.bulletItem}>
              &bull; a bank, deposit-taker, payment processor, money transmitter, credit provider or payment clearing house;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; connected to, endorsed by, or acting for EcoCash, Econet, InnBucks, any bank or any other provider. Those names and logos belong to their owners and appear only to help you identify the kind of record you are entering;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; an accountant, tax adviser, lawyer or financial adviser. Nothing in the App is professional advice, and you should not rely on it alone for tax filings, loans, investment or legal decisions.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 8 }]}>
              The App does not move money. It only records and analyses information that you or your imported files provide.
            </Text>

            <Text style={styles.subHeading}>4. Your account and device security</Text>
            <Text style={styles.bulletItem}>
              &bull; You are responsible for the accuracy of the details you give us and for keeping your password, till PIN and device secure.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Much of your data is stored on your own device. If you lose your device, uninstall the App, or clear its data without a backup, your records may be lost and we may not be able to recover them.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; You are responsible for creating backups (for example, using the App’s backup export) and for keeping them safe.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Tell us promptly if you believe someone has accessed your account without permission.
            </Text>

            <Text style={styles.subHeading}>5. Accuracy of records, calculations and estimates</Text>
            <Text style={styles.bulletItem}>
              &bull; The App’s totals are only as good as the records you enter or import. You are responsible for checking them.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Features that read SMS text, CSV statements or receipts try to guess the amount, direction, date and category. They can be wrong. Please review imported and suggested records, especially anything marked as pending review.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; “Operating profit” is an estimate. It does not account for unpaid stock credit, closing stock changes, tax, or other items you have not recorded.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Exchange rates are rates you set or default rates built into the App. They are not official or live market rates unless the App clearly says so.
            </Text>

            <Text style={styles.subHeading}>6. AI features</Text>
            <Text style={styles.bodyParagraph}>
              The App may offer AI-generated explanations and categorisation suggestions, which use Google’s Gemini service.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; AI output can be incomplete or wrong. It is an aid to understanding your numbers, not advice, and you should verify important figures against your own records.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Where the App asks for your own Google Gemini API key, you are responsible for that key, for any costs on your Google account, and for complying with Google’s terms. Keep the key private.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; If you use AI features, parts of your business data (such as totals, categories and recent entries) are sent to Google to produce a response. See our Privacy Policy for details. You can use the App without AI features.
            </Text>

            <Text style={styles.subHeading}>7. Plans, licence keys and payments</Text>
            <Text style={styles.bulletItem}>
              &bull; The App may offer a free tier (Starter) and paid tiers (such as Pro and Enterprise) that unlock extra features. Features and limits for each tier are described in the App.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; A licence key is personal to the trader or business it was issued for. You must not share it, sell it, publish it, or try to generate, alter or bypass licence keys or licence checks.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Licences may expire on the date shown with the key. After expiry, paid features may be switched off, but you keep access to your own records.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Prices, payment methods and refund terms:</Text> Starter tier is 100% free forever. Pro and Enterprise commercial licence keys are currently offered with a 14-day free trial or one-time offline activation. Where payment is collected, payments are accepted via EcoCash, InnBucks or card with a 14-day money-back guarantee. Paid plans are otherwise not yet charged for during the public preview. Where required by law, you keep your statutory consumer rights.
            </Text>

            <Text style={styles.subHeading}>8. Acceptable use</Text>
            <Text style={styles.bodyParagraph}>
              You agree not to:
            </Text>
            <Text style={styles.bulletItem}>
              &bull; use the App for anything unlawful, including fraud, money laundering, tax evasion or dealing in stolen goods or funds;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; enter or upload data you have no right to use, or files that contain malware;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; reverse engineer, copy or resell the App’s licensing system, or interfere with its security;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; overload, probe or attack our servers or other users;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; use the App to harass, defame or unfairly target any person.
            </Text>

            <Text style={styles.subHeading}>9. Customer credit, debts and information about other people</Text>
            <Text style={styles.bodyParagraph}>
              The App lets you record what customers owe you and what you owe suppliers, which can include names and phone numbers.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; You are responsible for having a lawful reason to hold this information and for using it fairly and in line with applicable data protection law.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; The App is a notebook, not a debt-collection service. We do not contact your customers or enforce any debt.
            </Text>

            <Text style={styles.subHeading}>10. Reporting individuals or fraud</Text>
            <Text style={styles.bodyParagraph}>
              Some features let traders record or report suspicious people or incidents (for example, fake payment messages, counterfeit notes or credit defaulters). If you use them:
            </Text>
            <Text style={styles.bulletItem}>
              &bull; report only what you honestly believe to be true, in good faith, and keep to the facts;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; do not include information you are not entitled to share, and do not use these features to harass, threaten or shame anyone;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; you are responsible for what you write about other people, including any legal consequences of false or careless statements;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; we may remove or restrict content and accounts that break these rules.
            </Text>

            <Text style={styles.subHeading}>11. Intellectual property</Text>
            <Text style={styles.bodyParagraph}>
              The App’s source code is published under the MIT Licence as stated in the project’s repository, and nothing in these Terms limits the rights that licence gives you. The App’s name, logo and branding, and the third-party logos shown in it, are not licensed to you under the MIT Licence unless we say so.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 8 }]}>
              You keep ownership of the data and records you enter. You give us permission to store and process that data only as needed to run the App for you, as described in our Privacy Policy.
            </Text>

            <Text style={styles.subHeading}>12. Third-party services</Text>
            <Text style={styles.bodyParagraph}>
              The App may work with or depend on third parties, such as Google (Gemini), app stores, hosting providers and Expo. We do not control them and are not responsible for their services, outages, charges or terms.
            </Text>

            <Text style={styles.subHeading}>13. Availability, updates and preview versions</Text>
            <Text style={styles.bodyParagraph}>
              We try to keep the App working, but we do not promise it will always be available or free from errors. Some versions are labelled preview or beta and may change or have bugs. We may update, change or remove features, and we may release updates that you need to install to keep using the App.
            </Text>

            <Text style={styles.subHeading}>14. Disclaimer</Text>
            <Text style={styles.bodyParagraph}>
              To the fullest extent allowed by law, the App is provided “as is” and “as available”. We do not give any warranty that it is accurate, uninterrupted, secure, or fit for a particular purpose, except those that the law says cannot be excluded.
            </Text>

            <Text style={styles.subHeading}>15. Limit of our responsibility</Text>
            <Text style={styles.bodyParagraph}>
              To the fullest extent allowed by law:
            </Text>
            <Text style={styles.bulletItem}>
              &bull; we are not liable for indirect or consequential loss, or for loss of profit, business, goodwill or data, arising from your use of the App;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; we are not liable for decisions you make based on the App’s figures, estimates or AI output, or for losses from lost devices, lost backups, wrong imports or mistaken entries;
            </Text>
            <Text style={styles.bulletItem}>
              &bull; our total liability to you for any claim related to the App is limited to the amount you paid us for the App in the 12 months before the claim, or <Text style={styles.boldText}>US$25.00</Text> if you paid nothing.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 8 }]}>
              Nothing in these Terms excludes liability that cannot lawfully be excluded, such as liability for fraud or for death or personal injury caused by negligence.
            </Text>

            <Text style={styles.subHeading}>16. Indemnity</Text>
            <Text style={styles.bodyParagraph}>
              You agree to cover us for losses and claims that arise from your breach of these Terms, your unlawful use of the App, or content you record or report about others, to the extent the law allows.
            </Text>

            <Text style={styles.subHeading}>17. Suspension and ending your use</Text>
            <Text style={styles.bulletItem}>
              &bull; You can stop using the App at any time and may ask us to delete any account data we hold about you.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; We may suspend or end your access if you seriously or repeatedly break these Terms, misuse licence keys, or put other people or the App at risk.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; Sections that by their nature should continue after you stop using the App (such as 14 to 16 and 19) will continue.
            </Text>

            <Text style={styles.subHeading}>18. Changes to these Terms</Text>
            <Text style={styles.bodyParagraph}>
              We may update these Terms from time to time. If we make a significant change, we will tell you in the App or by another reasonable method. If you keep using the App after the change takes effect, you accept the updated Terms.
            </Text>

            <Text style={styles.subHeading}>19. Governing law and disputes</Text>
            <Text style={styles.bodyParagraph}>
              These Terms are governed by the laws of Zimbabwe. If a dispute arises, please contact us first so we can try to resolve it in good faith. If we cannot, the courts of Zimbabwe will have jurisdiction, unless the law gives you the right to bring a claim somewhere else.
            </Text>

            <Text style={styles.subHeading}>20. Contact</Text>
            <Text style={styles.bodyParagraph}>
              Questions about these Terms:
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Operator:</Text>
              <Text style={styles.detailValue}>Maqhawe T Ngwenya</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Support Email:</Text>
              <Text style={styles.detailValue}>support@cashflowmate.app</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Location:</Text>
              <Text style={styles.detailValue}>Harare, Zimbabwe</Text>
            </View>
          </View>
        )}

        {/* Specialized Policy Pages Navigation Hub */}
        <View style={[styles.otherPoliciesCard, { borderRadius: cardRadius }]}>
          <Text style={styles.otherPoliciesTitle}>Specialized Policies &amp; Disclaimers</Text>
          <Text style={styles.otherPoliciesSubtitle}>
            Specific commercial terms, storage practices, and AI calculation boundaries are published on their own dedicated pages:
          </Text>

          <Pressable
            onPress={() => router.push('/refund' as any)}
            style={styles.otherPolicyRow}
            accessibilityRole="button"
            accessibilityLabel="Open Refund and Fees Policy"
          >
            <View style={styles.otherPolicyLeft}>
              <View style={[styles.policyIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="card" size={17} color="#059669" />
              </View>
              <View style={styles.policyTextBox}>
                <Text style={styles.otherPolicyName}>Refund &amp; Fees Policy</Text>
                <Text style={styles.otherPolicyDesc}>100% Free Core &bull; 14-day refund window</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/cookies' as any)}
            style={styles.otherPolicyRow}
            accessibilityRole="button"
            accessibilityLabel="Open Cookies and Storage Policy"
          >
            <View style={styles.otherPolicyLeft}>
              <View style={[styles.policyIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="server" size={17} color="#0284C7" />
              </View>
              <View style={styles.policyTextBox}>
                <Text style={styles.otherPolicyName}>Cookies &amp; Storage Policy</Text>
                <Text style={styles.otherPolicyDesc}>Strict local storage &bull; Zero tracking cookies</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/disclaimer' as any)}
            style={styles.otherPolicyRow}
            accessibilityRole="button"
            accessibilityLabel="Open AI and Financial Disclaimer"
          >
            <View style={styles.otherPolicyLeft}>
              <View style={[styles.policyIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="alert-circle" size={17} color="#D97706" />
              </View>
              <View style={styles.policyTextBox}>
                <Text style={styles.otherPolicyName}>AI &amp; Financial Disclaimer</Text>
                <Text style={styles.otherPolicyDesc}>Deterministic calculation &bull; Not tax advice</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06152E',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#06152E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  otherPoliciesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  otherPoliciesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  otherPoliciesSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  otherPolicyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  otherPolicyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  policyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTextBox: {
    flex: 1,
  },
  otherPolicyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  otherPolicyDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A192F',
    marginTop: 16,
    marginBottom: 8,
  },
  bodyParagraph: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginTop: 4,
    paddingLeft: 4,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
});

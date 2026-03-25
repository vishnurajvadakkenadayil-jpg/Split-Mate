# **App Name**: SplitMate

## Core Features:

- User & Group Management: Users can register and log in via email or Google. They can create new roommate groups or join existing ones, managing their personal profile with name and avatar.
- Bill Entry & Categorization: Add new bills with essential details like title, amount, category (e.g., rent, utilities), and a due date. Users can optionally upload a receipt image.
- Intelligent Bill Splitting: Distribute bill costs either equally among group members or use custom splitting rules based on fixed amounts or percentages for each person.
- Recurring Bills Automation: Mark bills as recurring on a monthly basis, with automated creation of new bill entries through a backend Cloud Function to streamline financial tracking.
- Balance Tracking & Settlement: View an overview of who owes whom within the group, displaying individual balances. A 'Settle Up' feature allows for manual balance reconciliation.
- AI-Powered Receipt Scan: Upload a receipt image and use an AI tool to automatically extract key information such as the total amount and bill category, pre-filling the bill entry form.
- Expense History & Basic View: Review a chronological list of all past expenses within the group. This feature focuses on clear display of historical spending data.

## Style Guidelines:

- Primary color: A dependable medium blue (#2E73B8) to evoke trust and clarity for core interactions like buttons and primary text.
- Background color: An airy, subtle bluish-gray (#F3F5F7) providing a clean canvas that enhances readability and keeps focus on financial data.
- Accent color: A vibrant yet clean cyan (#5CD6D6) for highlighting important elements, notifications, and interactive components, ensuring good contrast and visibility.
- Body and headline font: 'Inter', a grotesque-style sans-serif, chosen for its modern, neutral, and highly readable appearance across all content, from financial figures to user interface labels.
- Utilize a consistent set of clean, outlined, system-standard icons that provide intuitive visual cues without distracting from the primary financial information.
- Implement a clear, card-based layout for dashboards and lists, prioritizing data visibility and intuitive navigation. The design will be responsive, adapting smoothly to different screen sizes for a modern web experience.
- Incorporate subtle and swift UI animations for transitions between screens, feedback on user actions (e.g., button clicks, item additions), and data updates, enhancing the overall user experience without causing delays.
# Pinterest Pin Automation - Screen Flows

---

## Main Navigation

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR                  MAIN CONTENT AREA             │
│  ┌──────────┐                                           │
│  │ Dashboard │  ←── Currently viewing                   │
│  │ Review    │                                          │
│  │ Queue     │                                          │
│  │ Settings  │                                          │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 1: Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pinterest Pin Automation                                           │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                          │
│  Dashboard│  DASHBOARD                                              │
│  Review   │                                                         │
│  Queue    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  Settings │  │  NEW     │ │ PENDING  │ │SCHEDULED │ │  POSTED  │  │
│          │  │          │ │  REVIEW  │ │          │ │          │  │
│          │  │    12    │ │    5     │ │    18    │ │    43    │  │
│          │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│          │                                                          │
│          │  ┌────────────────────────────────────────────────────┐  │
│          │  │                                                    │  │
│          │  │  ┌─────────────────┐    Posting Interval           │  │
│          │  │  │  ☁ Sync Photos  │    ┌─────────────────────┐   │  │
│          │  │  │  from Drive     │    │ Every [ 24 ] hours  │   │  │
│          │  │  └─────────────────┘    └─────────────────────┘   │  │
│          │  │                                                    │  │
│          │  │  Last synced: Jan 24, 2026 at 2:30 PM             │  │
│          │  │                                                    │  │
│          │  └────────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  RECENT ACTIVITY                                         │
│          │  ─────────────────────────────────────────────────────   │
│          │  • 3 pins posted today                                   │
│          │  • 5 photos awaiting review                              │
│          │  • Next pin scheduled for Jan 25 at 10:00 AM             │
│          │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## Screen 2: Review Queue

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pinterest Pin Automation                                           │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                          │
│  Dashboard│  REVIEW QUEUE                    [ Bulk Approve All ]   │
│ >Review  │                                                          │
│  Queue    │  Showing 5 photos ready for review                      │
│  Settings │                                                         │
│          │  ┌─────────────────────────────────────────────────────┐ │
│          │  │ ┌─────────┐                                         │ │
│          │  │ │         │  Tags: [henna] [bridal] [mehndi]        │ │
│          │  │ │  Photo  │        [pakistani] [wedding] [+add]     │ │
│          │  │ │  thumb  │                                         │ │
│          │  │ │         │  Board: [ henna        ▼ ]              │ │
│          │  │ └─────────┘                                         │ │
│          │  │              ☑ Link to: instagram.com/__hennabyhafsa│ │
│          │  │                                                     │ │
│          │  │              [ ✓ Approve ]    [ ✗ Skip ]            │ │
│          │  └─────────────────────────────────────────────────────┘ │
│          │                                                          │
│          │  ┌─────────────────────────────────────────────────────┐ │
│          │  │ ┌─────────┐                                         │ │
│          │  │ │         │  Tags: [nails] [floral] [spring]        │ │
│          │  │ │  Photo  │        [manicure] [+add]                │ │
│          │  │ │  thumb  │                                         │ │
│          │  │ │         │  Board: [ nails         ▼ ]             │ │
│          │  │ └─────────┘                                         │ │
│          │  │              ☐ Link to: (none)                      │ │
│          │  │                                                     │ │
│          │  │              [ ✓ Approve ]    [ ✗ Skip ]            │ │
│          │  └─────────────────────────────────────────────────────┘ │
│          │                                                          │
│          │  ┌─────────────────────────────────────────────────────┐ │
│          │  │ ┌─────────┐                                         │ │
│          │  │ │         │  Tags: [outfits] [thrifted] [vintage]   │ │
│          │  │ │  Photo  │        [+add]                           │ │
│          │  │ │  thumb  │                                         │ │
│          │  │ │         │  Board: [ thrifted      ▼ ]             │ │
│          │  │ └─────────┘                                         │ │
│          │  │              ☐ Link to: (none)                      │ │
│          │  │                                                     │ │
│          │  │              [ ✓ Approve ]    [ ✗ Skip ]            │ │
│          │  └─────────────────────────────────────────────────────┘ │
│          │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## Screen 3: Posting Queue

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pinterest Pin Automation                                           │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                          │
│  Dashboard│  POSTING QUEUE                   [ ⏸ Pause Queue ]     │
│  Review   │                                                         │
│ >Queue   │  18 pins scheduled • Next post: Jan 25 at 10:00 AM      │
│  Settings │                                                         │
│          │  ┌───┬───────────────────────────────────────────────┐   │
│          │  │ ≡ │  #1  ┌──────┐ henna_design_04.jpg            │   │
│          │  │   │      │ thumb│ Board: henna                    │   │
│          │  │   │      └──────┘ Tags: henna, bridal, mehndi    │   │
│          │  │   │               Scheduled: Jan 25, 10:00 AM     │   │
│          │  └───┴───────────────────────────────────────────────┘   │
│          │                                                          │
│          │  ┌───┬───────────────────────────────────────────────┐   │
│          │  │ ≡ │  #2  ┌──────┐ nail_art_12.jpg                │   │
│          │  │   │      │ thumb│ Board: nails                    │   │
│          │  │   │      └──────┘ Tags: nails, floral, spring    │   │
│          │  │   │               Scheduled: Jan 26, 10:00 AM     │   │
│          │  └───┴───────────────────────────────────────────────┘   │
│          │                                                          │
│          │  ┌───┬───────────────────────────────────────────────┐   │
│          │  │ ≡ │  #3  ┌──────┐ thrift_find_07.jpg             │   │
│          │  │   │      │ thumb│ Board: thrifted                 │   │
│          │  │   │      └──────┘ Tags: thrifted, vintage         │   │
│          │  │   │               Scheduled: Jan 27, 10:00 AM     │   │
│          │  └───┴───────────────────────────────────────────────┘   │
│          │                                                          │
│          │  ┌───┬───────────────────────────────────────────────┐   │
│          │  │ ≡ │  #4  ┌──────┐ bridal_look_02.jpg             │   │
│          │  │   │      │ thumb│ Board: bridal                   │   │
│          │  │   │      └──────┘ Tags: bridal, desi, wedding    │   │
│          │  │   │               Scheduled: Jan 28, 10:00 AM     │   │
│          │  └───┴───────────────────────────────────────────────┘   │
│          │                                                          │
│          │          ≡ = drag handle to reorder                      │
│          │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## Screen 4: Settings

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pinterest Pin Automation                                           │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                          │
│  Dashboard│  SETTINGS                                               │
│  Review   │                                                         │
│  Queue    │  ── Google Drive ──────────────────────────────────────  │
│ >Settings│                                                          │
│          │  Status: ● Connected                                     │
│          │  Folder ID: [ 1aBcDeFgHiJkLmNoPqRsTuVwXyZ  ]           │
│          │  [ Reconnect Drive ]                                     │
│          │                                                          │
│          │  ── Pinterest Account ──────────────────────────────────  │
│          │                                                          │
│          │  Status: ● Connected as @byyhafsa                        │
│          │  [ Reconnect Pinterest ]                                  │
│          │                                                          │
│          │  ── Posting Frequency ──────────────────────────────────  │
│          │                                                          │
│          │  Post every: [ 24 ] hours                                │
│          │  Default time: [ 10:00 AM ]                              │
│          │                                                          │
│          │  ── Board Mappings ─────────────────────────────────────  │
│          │                                                          │
│          │  ┌────────────┬────────────────┬───────────────────────┐ │
│          │  │ Category   │ Board          │ Link URL              │ │
│          │  ├────────────┼────────────────┼───────────────────────┤ │
│          │  │ henna      │ henna          │ instagram.com/        │ │
│          │  │            │                │  __hennabyhafsa       │ │
│          │  │ desi       │ desi           │ —                     │ │
│          │  │ bridal     │ bridal         │ —                     │ │
│          │  │ thrifted   │ thrifted       │ —                     │ │
│          │  │ nails      │ nails          │ —                     │ │
│          │  │ outfits    │ outfits        │ —                     │ │
│          │  │ floral     │ floral         │ —                     │ │
│          │  │ neutral    │ neutral        │ —                     │ │
│          │  └────────────┴────────────────┴───────────────────────┘ │
│          │                                                          │
│          │  [ Save Settings ]                                       │
│          │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## User Flow Diagram

```
                    ┌─────────────────┐
                    │  User adds      │
                    │  photos to      │
                    │  Google Drive   │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                 │
│                                                                  │
│   User clicks [ Sync Photos ]                                    │
│                                                                  │
│   System pulls new photos from Drive folder                      │
│   Stats update: "12 new photos"                                  │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Photos auto-analyzed by AI
                           │ (generates tags + assigns board)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REVIEW QUEUE                                │
│                                                                  │
│   Each photo shows:                                              │
│   • AI-generated tags (user can edit/add/remove)                 │
│   • Auto-assigned board (user can change via dropdown)           │
│   • Auto-checked link (if henna → links to IG)                  │
│                                                                  │
│   User actions:                                                  │
│   • [ Approve ] → sends to posting queue                         │
│   • [ Skip ] → removes from review                              │
│   • [ Bulk Approve ] → approves all visible                     │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Approved photos get scheduled
                           │ (evenly spaced by interval)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POSTING QUEUE                               │
│                                                                  │
│   Shows all approved pins in order with scheduled dates          │
│                                                                  │
│   Example: 20 pins, 1/day interval                               │
│   → Pin #1: Jan 25 at 10am                                      │
│   → Pin #2: Jan 26 at 10am                                      │
│   → Pin #3: Jan 27 at 10am                                      │
│   → ...                                                          │
│   → Pin #20: Feb 13 at 10am                                     │
│                                                                  │
│   User can:                                                      │
│   • Drag to reorder (dates auto-recalculate)                    │
│   • [ Pause Queue ] to stop all posting                          │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ System auto-posts at scheduled times
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PINTEREST                                   │
│                                                                  │
│   Pin posted to correct board with:                              │
│   • Photo from Drive                                             │
│   • Tags as description (#henna #bridal #mehndi)                │
│   • Link URL (if applicable)                                     │
│                                                                  │
│   Dashboard updates: "Posted" count increases                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interaction Details

### Tag Editing (Review Screen)
```
Before edit:                    After edit:
┌───────────────────────┐      ┌───────────────────────┐
│ [henna] [bridal] [+]  │  →   │ [henna] [bridal]      │
│                       │      │ [pakistani] [wedding]  │
│                       │      │ [mehndi] [+]           │
└───────────────────────┘      └───────────────────────┘

• Click tag to remove
• Click [+] to add new tag
• Tags are used as Pinterest description
```

### Board Auto-Assignment Logic
```
AI detects "henna" tag  →  Board auto-set to "henna"
                        →  Link auto-checked ✓ (instagram.com/__hennabyhafsa)

AI detects "nails" tag  →  Board auto-set to "nails"
                        →  Link unchecked (no default link)

Multiple categories?    →  Uses highest-confidence tag for board
                        →  User can override via dropdown
```

### Queue Drag Reorder
```
Before:                         After dragging #3 to #1:
┌──────────────────────┐       ┌──────────────────────┐
│ #1 henna_04  Jan 25  │       │ #1 thrift_07 Jan 25  │  ← was #3
│ #2 nail_12   Jan 26  │       │ #2 henna_04  Jan 26  │  ← was #1
│ #3 thrift_07 Jan 27  │  →    │ #3 nail_12   Jan 27  │  ← was #2
│ #4 bridal_02 Jan 28  │       │ #4 bridal_02 Jan 28  │
└──────────────────────┘       └──────────────────────┘

Dates automatically recalculate to maintain even spacing
```

---

## Mobile Responsiveness Note

The interface will be responsive:
- **Desktop:** Sidebar + main content side by side
- **Mobile:** Sidebar becomes top navigation bar, cards stack vertically

---

## Summary for Client

| Screen | Purpose | Key Actions |
|--------|---------|-------------|
| Dashboard | Overview + sync trigger | Sync from Drive, set posting frequency |
| Review Queue | Review AI-tagged photos | Edit tags, change board, approve/skip |
| Posting Queue | Manage scheduled pins | Reorder by drag, pause posting |
| Settings | Configure connections | Connect Drive/Pinterest, map boards |

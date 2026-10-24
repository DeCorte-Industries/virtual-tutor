# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS in `public/` (no build step), deployed to Netlify with two Netlify Functions for owner-edited content. Confirmed: keep this stack.

## Users

Parents of middle- and high-school students and the students themselves (confirmed: both equally). They are looking for a trustworthy live online math tutor for Algebra 1, Geometry, Algebra 2, Precalculus, or Calculus AB, and want to book an intro call or a session.

## Product Purpose

Math with Henry is the private virtual tutoring business of Henry Oglesby: live one-on-one or small-group (up to 4) online sessions on a shared digital whiteboard. Success is a visitor booking the free 10-minute intro call or a 1-hour session through Cal.com.

## Positioning

One experienced teacher (30+ years, former Teacher of the Year) personally teaching every session, paced to the student, with faith-informed values.

## Operating Context

Booking runs through Cal.com embeds (`hoglesby/intro-call`, `hoglesby/one-hour-tutoring`). Payment is by Zelle, due the Sunday before the session week. 48-hour reschedule notice. Henry edits a verse of the day and two notes (Math, Other topics) at `/admin/`, stored in Netlify Blobs and read through `/api/content`.

## Capabilities and Constraints

- Rates: $50/hour 1:1; $40/student/hour for groups up to 4; free 10-minute intro call.
- Weekly availability and payment/cancellation policy as currently published.
- All existing copy, rates and availability are preserved word-for-word unless Henry changes them.
- Cal.com booking triggers, verse banner, optional notes section, and `/admin` editing must keep working.
- Charities section (Wounded Warrior Project, Humane World for Animals, St. Jude) is retained, with the non-endorsement disclaimer.

## Brand Commitments

- The name "Math with Henry" is the brand and must not change.
- Preserve the orca and sextant photos and the charities section.

## Evidence on Hand

One real parent testimonial (Mrs. Allison); credentials (Barton College BS, Georgia State master's, 7-12 certification, Teacher of the Year); `public/images/orca.jpg`, `public/images/sextant.jpg`, `public/images/favicon.svg`, and a business card front/back at the repo root. No other testimonials, results data, or reviews exist; none may be invented.

## Product Principles

1. Trust first: a parent should feel they are meeting a real, experienced teacher.
2. Booking is always one tap away.
3. Plain truth: no invented claims, results, or testimonials.
4. Faith and character are part of Henry's identity, stated warmly, not pushed.

## Accessibility & Inclusion

Readable for students and parents on phones; keyboard-operable FAQ, menu, and booking controls; visible focus; sufficient contrast.

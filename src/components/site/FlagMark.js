/**
 * Flag of the Republic of Higeria — an original design for this fictional country.
 *
 *  • Field: Lagoon teal (#0E5C58)
 *  • A rising Ember-coral diagonal band (#C4422A) from the lower hoist to the upper fly,
 *    edged by two narrow Ivory stripes (#F3E9D2)
 *  • In the upper hoist: an open Ivory ring around a small Ivory disc — the "Dawn Ring"
 *
 * Proportion 3:2. Neither the design nor its teal / coral / ivory colour combination is used
 * by any national flag.
 */
export const HIGERIA_COLORS = { lagoon: '#0E5C58', ember: '#C4422A', ivory: '#F3E9D2' };

export default function FlagMark({ className = 'h-8 w-auto' }) {
  const { lagoon, ember, ivory } = HIGERIA_COLORS;
  return (
    <svg viewBox="0 0 300 200" className={className} role="img" aria-label="Flag of Higeria">
      <rect width="300" height="200" fill={lagoon} />
      {/* Ivory fimbriation, then the Ember band, running from lower hoist to upper fly */}
      <path d="M0 200 L0 150 L240 0 L300 0 L300 50 L60 200 Z" fill={ivory} />
      <path d="M0 200 L0 168 L268 0 L300 0 L300 32 L32 200 Z" fill={ember} />
      {/* Dawn Ring */}
      <circle cx="62" cy="58" r="30" fill="none" stroke={ivory} strokeWidth="9" />
      <circle cx="62" cy="58" r="9" fill={ivory} />
    </svg>
  );
}

import { domAnimation } from "framer-motion";

/** The feature set the nav pill needs, in a chunk of its own.
 *
 *  `LazyMotion` takes an import function, so this bundle leaves the
 *  shared chunk that every page loads first. Until it arrives the pill
 *  still renders in place, because `initial={false}` makes the animation
 *  target the first static style; it just cannot move yet. */
export default domAnimation;

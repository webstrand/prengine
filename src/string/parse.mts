import { closeBraces, openBraces } from "./cache.mjs";

export type VisitConst = (constant: string, offset: number) => void;
export type VisitExpr = (expression: string, offset: number) => void;

/**
 * Parse a string containing `$` followed by matched sets of `{`s and `}`s into
 * constants and expressions.
 */
export function parse(str: string, visitConst: VisitConst, visitExpr: VisitExpr): boolean {
	/*
	 * Overview:
	 *
	 * We look for a `$` followed by a matched set of `{`s and `}`s delimiting
	 * an expression segment. If we find one, we visit any preceeding constant
	 * segment and then visit the expression segment. We repeat this until the
	 * entire string is consumed.
	 */
	{
		/**
		 * Offset into the string at the start of the constant segment.
		 */
		let constStart = 0;

		for(let cursor = 0;;) {
			/**
			 * Offset into the string before a sequence of `${` opens an
			 * expression segment.
			 */
			const exprOpen = str.indexOf("${", cursor);
			if(exprOpen === -1) break;

			/**
			 * Width of the opening `{` sequence in characters
			 */
			let w = 0;
			while(str[exprOpen + w + 1] === "{") { w++ }

			/**
			 * Offset into the string at the start of the expression segment.
			 */
			const exprStart = exprOpen + w + 1;

			/**
			 * Offset into the string at the end of the expression statement.
			 * Does not match closing sequences of incorrect width.
			 */
			const exprEnd = str.indexOf(closeBraces[w] ??= "}".repeat(w), exprOpen + w);

			/**
			 * Offset into the the string after a sequence of `}` closes an
			 * expression segment.
			 */
			const exprClose = exprEnd + w;

			// If we haven't found a closing sequence we discard the starting
			// sequence as spurious.
			if(exprEnd === -1) {
				// Restart after the opening sequence of `{`.
				cursor += w + 1;
				continue;
			}

			/** The expression segment, not including the `{`s and `}`s */
			const expr = str.slice(exprStart, exprEnd);

			// If the leading constant segment is not empty, visit it first.
			if(exprOpen !== constStart) {
				visitConst(str.slice(constStart, exprOpen), constStart);
			}

			visitExpr(expr, exprOpen);
			// The next constant segment starts immediately after the closing
			// sequence of `}`.
			constStart = exprClose;

			// We need to search for the next opening sequence of `${`
			// immediately after the closing sequence of `}`.
			cursor = exprClose;
		}

		// If the remaining constant segment is the entire string, we failed to
		// find any expression segments.
		if(constStart === 0) return false;

		// Visit the remaining constant segment, if any.
		if(constStart < str.length) {
			visitConst(str.slice(constStart), constStart);
		}
	}

	return true;
}

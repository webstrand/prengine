export declare type VisitConst = (constant: string, offset: number) => void;
export declare type VisitExpr = (expression: string, offset: number) => void;
/**
 * Parse a string containing `$` followed by matched sets of `{`s and `}`s into
 * constants and expressions.
 */
export declare function parse(str: string, visitConst: VisitConst, visitExpr: VisitExpr): boolean;

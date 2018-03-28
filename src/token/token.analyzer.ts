import { Tree } from '../tree/simple.tree/type';
import { TokenHelper } from './token.helper';
import { Token } from './token';
import { AbstractSyntaxTree } from '../ast';
import { TokenEnumerable } from './token.enumerable';
import { ParserError } from '../error';
import { TokenError } from './token.error';
import { TreeBuilder } from '../tree/simple.tree/builder';

export class TokenAnalyzer extends TokenEnumerable {
    private ast: AbstractSyntaxTree;
    private currentTree: AbstractSyntaxTree;

    constructor(token: Token.Token[]) {
        super(token);
    }

    public parse(): Tree {
        this.initialize();
        this.makeAst();
        return this.makeTree();
    }

    private initialize() {
        this.ast = new AbstractSyntaxTree(Token.literal.BracketOpen);
        this.ast.leftNode = new AbstractSyntaxTree();
        this.currentTree = this.ast.leftNode;
        this.rewind();
    }

    public getAst(): AbstractSyntaxTree {
        return this.ast;
    }

    private makeAst() {
        let token;
        while (token = this.next()) {
            this.analyzeToken(token);
            this.addStack(token);
        }
        this.ast = this.ast.removeClosestBracket().findRoot();
    }

    private analyzeToken(token: Token.Token) {
        if (TokenHelper.isBracket(token)) {
            this.analyzeBracketToken(token);
            return;
        }

        if (TokenHelper.isOperator(token)) {
            this.analyzeOperatorToken(token);
            return;
        }

        this.currentTree.insertNode(token);
    }

    private analyzeBracketToken(token: Token.Token) {
        const lastToken = this.popStack();
        if (TokenHelper.isBracketOpen(token)) {
            if (lastToken && !TokenHelper.isSymbol(lastToken))
                this.insertImplicitMultiplication();

            this.currentTree = this.currentTree.insertNode(token);
            return;
        }

        if (TokenHelper.isBracketClose(token)) {
            this.currentTree = this.currentTree.removeClosestBracket();
            this.ast = this.currentTree.findRoot();
            return;
        }
    }

    private analyzeOperatorToken(token: Token.Token) {
        const lastToken = this.popStack();

        if (TokenHelper.isOperator(lastToken))
            throw new ParserError(TokenError.invalidTwoOperator, lastToken, token).withStack(this.stack);

        if (!this.currentTree.value)
            this.currentTree.value = token;
        else {
            if (!TokenHelper.isBracket(this.currentTree.value) && !this.currentTree.rightNode)
                throw new ParserError(TokenError.invalidTwoOperator, lastToken, token).withStack(this.stack);

            this.currentTree = this.currentTree.insertNode(token);
            this.ast = this.ast.findRoot();
        }
    }

    private insertImplicitMultiplication() {
        this.analyzeToken(Token.literal.Multiplication);
        this.addStack(Token.literal.Multiplication);
    }

    private makeTree(): Tree {
        const treeParser = new TreeBuilder(this.ast);
        return treeParser.makeTree();
    }
}

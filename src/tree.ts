import { AbstractSyntaxTree } from './ast';
import { Operand, OperandValue, TreeModel } from './tree.type';
import { TokenHelper } from './token/token.helper';
import { Token } from './token/token';
import { AbstractSyntaxTreeHelper } from './ast.helper';
import { TreeError } from './tree.error';
import { ParserError } from './error';

export class Tree {
    public constructor(private ast: AbstractSyntaxTree) {
    }

    public makeTree(): TreeModel {
        if (!this.ast)
            throw new ParserError(TreeError.astIsEmpty);

        const tree = this.makeNode(this.ast);
        if ((tree as Operand).value)
            throw new ParserError(TreeError.invalidParserTree);

        return tree as TreeModel;
    }

    private makeNode(sourceNode: AbstractSyntaxTree): TreeModel | Operand {
        return sourceNode.type === Token.Type.Operator
            ? this.makeOperatorNode(sourceNode)
            : this.makeValueNode(sourceNode);
    }

    private makeOperatorNode(sourceNode: AbstractSyntaxTree): TreeModel {
        return {
            operator: sourceNode.value,
            operand1: this.makeNode(sourceNode.leftNode),
            operand2: this.makeNode(sourceNode.rightNode)
        };
    }

    private makeValueNode(sourceNode: AbstractSyntaxTree): Operand {
        return {
            value: this.makeOperandValue(sourceNode)
        };
    }

    private makeOperandValue(sourceNode: AbstractSyntaxTree): OperandValue {
        const type = TokenHelper.isObject(sourceNode.value)
            ? 'item'
            : 'unit';
        return {
            type,
            [type]: sourceNode.value
        };
    }
}

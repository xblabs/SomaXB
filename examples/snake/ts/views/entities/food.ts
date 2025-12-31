export class Food {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    rgba = 'rgba(129, 45, 37, 0.8)';

    draw(context: CanvasRenderingContext2D): void {
        context.save();
        context.fillStyle = this.rgba;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.restore();
    }
}

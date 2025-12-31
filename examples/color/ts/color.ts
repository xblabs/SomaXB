import { Application } from '../../../index';
import Emitter from '../../../src/Emitter';
import Mediators from '../../../src/Mediators';

// jQuery is loaded externally
declare var $: any;

interface ColorModelInterface {
    getColor(): string;
}

class ColorModel implements ColorModelInterface {
    static inject = ['emitter'];

    private color: string;

    constructor(emitter: Emitter) {
        emitter.addListener('all', () => this.changeColor(), undefined, 1);
        emitter.addListener('others', () => this.changeColor(), undefined, 1);
        this.color = this.getRandomColor();
    }

    private getRandomColor(): string {
        const letters = '0123456789ABCDEF'.split('');
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    }

    private changeColor(): void {
        this.color = this.getRandomColor();
    }

    getColor(): string {
        return this.color;
    }
}

class ContainerMediator {
    static inject = ['target', 'mediators'];

    constructor(target: HTMLElement, mediators: Mediators) {
        for (let i = 0; i < 20; i++) {
            $(target).append(
                '<div class="widget" data-id="' + i + '">' +
                '<button class="all">Change All</button>' +
                '<button class="others">Change Others</button>' +
                '</div>'
            );
        }
        mediators.create(WidgetMediator, Array.from($('.widget')));
    }
}

class WidgetMediator {
    static inject = ['target', 'emitter', 'colorModel'];

    constructor(target: HTMLElement, emitter: Emitter, colorModel: ColorModelInterface) {
        const id = $(target).attr('data-id');

        emitter.addListener('all', () => {
            $(target).css('background-color', colorModel.getColor());
        });

        emitter.addListener('others', (data: { id?: string }) => {
            if (id !== data?.id) {
                $(target).css('background-color', colorModel.getColor());
            }
        });

        $('.all', target).click(() => {
            emitter.dispatch('all');
        });

        $('.others', target).click(() => {
            emitter.dispatch('others', { id });
        });
    }
}

class App extends Application {
    protected init(): void {
        this.injector.mapClass('colorModel', ColorModel, true);
        this.mediators.create(ContainerMediator, document.querySelector('.container'));
    }
}

// Initialize the application
new App();

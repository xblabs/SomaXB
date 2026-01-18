import Emitter from '../../../src/Emitter';

type OrientationType = 'portrait' | 'landscape';

interface OrientationModuleInstance {
    getOrientation(): OrientationType;
    dispose(): void;
}

interface OrientationModuleClass {
    (emitter: Emitter): OrientationModuleInstance;
    id: string;
    inject: string[];
}

const OrientationModule: OrientationModuleClass = function(emitter: Emitter): OrientationModuleInstance {
    // hold current orientation
    let orientation: OrientationType = detectDeviceOrientation();

    // add listener to detect orientation change
    window.addEventListener('orientationchange', handler);

    // store the new orientation and dispatch an event
    function handler(): void {
        orientation = detectDeviceOrientation();
        emitter.dispatch('orientation', { direction: orientation });
    }

    // return the orientation, portrait or landscape
    function detectDeviceOrientation(): OrientationType {
        switch ((window as any).orientation) {
            case 90:
            case -90:
                return 'landscape';
            case 0:
            case 180:
            default:
                return 'portrait';
        }
    }

    // return module API
    return {
        getOrientation(): OrientationType {
            return orientation;
        },
        dispose(): void {
            window.removeEventListener('orientationchange', handler);
        }
    };
} as OrientationModuleClass;

OrientationModule.id = 'orientation';
OrientationModule.inject = ['emitter'];

export default OrientationModule;
export { OrientationModuleInstance };

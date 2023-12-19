declare module 'rolly.js' {
    /**
     * @link https://mickaelchanrion.github.io/rolly/api/#api-reference
     */
    interface GlobalState {
        current: number;
        previous: number;
        target: number;
        width: number;
        height: number;
        bounding: number;
        ready: boolean;
        preLoaded: boolean;
        transformPrefix: string;
    }

    /**
     * @link https://github.com/ayamflow/virtual-scroll#options
     */
    interface VirtualScrollOptions {
        el?: Element;
        mouseMultiplier?: number;
        touchMultiplier?: number;
        firefoxMultiplier?: number;
        keyStep?: number;
        preventTouch?: boolean;
        unpreventTouchClass?: string;
        passive?: boolean;
        useKeyboard?: boolean;
        useTouch?: boolean;
    }

        type TriggerValue = 'start' | 'end' | 'middle' | `${string}px` | `${string}%`;

        interface SceneStateCache {
            context: Element;
            type: string;
            top: number;
            bottom: number;
            left: number;
            right: number;
            size: number;
            speed: number;
            trigger: TriggerValue;
            /**
             * User extended values
             */
            [key: string]: any;
        }

        interface SceneState {
            caching: boolean;
            cache: SceneStateCache;
            inView: boolean;
            active: boolean;
            progress: number;
            progressInView: number;
        }

        // todo - not sure what cache type is here
        type SceneCallback = (globalState: GlobalState, sceneState: SceneState, transform: number) => void;

        interface SceneOptions {
            selector?: string;
            speed?: number;
            trigger?: TriggerValue;
            cache?: (cache: any, globalState: GlobalState, sceneState: SceneState) => void;
            change?: SceneCallback;
            appear?: SceneCallback;
            disappear?: SceneCallback;
            enter?: SceneCallback;
            leave?: SceneCallback;
            transform?: SceneCallback;
            [key: string]: Omit<SceneOptions, 'selector'>;
        }

        interface Options {
            vertical?: boolean;
            listener?: Element;
            view?: Element;
            native?: boolean;
            preload?: boolean;
            autoUpdate?: boolean;
            ready?: (globalState: GlobalState) => void;
            change?: (globalState: GlobalState) => void;
            changeStart?: (globalState: GlobalState) => void;
            changeEnd?: (globalState: GlobalState) => void;
            ease?: number;
            virtualScroll?: VirtualScrollOptions;
            noScrollBar?: boolean;
            scenes?: SceneOptions;
        }

        interface ScrollToOptions {
            position?: 'start' | 'end' | 'center';
            offset?: number;
            callback?: (globalState: GlobalState) => void;
        }

        class Rolly {
            constructor(options?: Options);
            init(): void;
            on(rAF: boolean): void;
            off(cAf: boolean): void;
            destroy(): void;
            reload(options?: Options): void;
            scrollTo(target: number|Element, options?: { duration?: number; ease?: number }): void;
            update(): void;
        }

        const rolly: (options?: Options) => Rolly;

        export default rolly;
}

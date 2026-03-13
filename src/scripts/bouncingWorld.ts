export interface Ball {
       x: number;
       y: number;
       vx: number;
       vy: number;
       radius: number;
}

export class Ball {
       constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 10;
        this.vy = 10;
        this.radius = 10;
        this.color = 'blue';
       };
       
       constructor(
        public x: number,
        public y: number,
        public vy: number,
        public vx: number,
        public radius: number,
        public color: string = 'red',
       ) {};
}
export function createBouncingWorld(container: HTMLDivElement) {
       
}
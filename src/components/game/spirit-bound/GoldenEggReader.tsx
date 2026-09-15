type Props = {
  onClose: () => void;
};

export const SECRET_DOCTRINE_EGG = `Nor Aught nor Nought existed; yon bright sky
Was not, nor heaven's broad roof outstretched above.
What covered all? what sheltered? what concealed?
Was it the water's fathomless abyss?
There was not death -- yet there was nought immortal,
There was no confine betwixt day and night;
The only One breathed breathless by itself,
Other than It there nothing since has been.
Darkness there was, and all at first was veiled
In gloom profound -- an ocean without light --
The germ that still lay covered in the husk
Burst forth, one nature, from the fervent heat.
. . . . . . . .
Who knows the secret? who proclaimed it here?
Whence, whence this manifold creation sprang?
The Gods themselves came later into being --
Who knows from whence this great creation sprang?
That, whence all this great creation came,
Whether Its will created or was mute,
The Most High Seer that is in highest heaven,
He knows it -- or perchance even He knows not.

http://www.theosociety.org/pasadena/sd/sd1-1-01.htm

The Secret Doctrine by H. P. Blavatsky, Vol 1, Stanzas of Dzyan

"Gazing into eternity . . .
Ere the foundations of the earth were laid,
. . . . .
Thou wert. And when the subterranean flame
Shall burst its prison and devour the frame . . .
Thou shalt be still as Thou wert before
And knew no change, when time shall be no more.
Oh! endless thought, divine ETERNITY."`;

export function GoldenEggReader({ onClose }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-3">
      <div
        className="pointer-events-auto flex max-h-[min(92%,520px)] w-full max-w-lg flex-col border-4 border-game-yellow bg-[#201808] shadow-[0_0_0_4px_#181010,inset_0_0_0_2px_#705018]"
        role="dialog"
        aria-labelledby="golden-egg-title"
      >
        <header className="border-b-2 border-game-yellow/40 px-4 py-3">
          <p id="golden-egg-title" className="text-[10px] tracking-[0.28em] text-game-yellow">
            GOLDEN EGG
          </p>
          <p className="mt-1 text-[9px] text-game-orange">Stanzas of Dzyan · The Secret Doctrine</p>
        </header>
        <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-3 font-pixel text-[9px] leading-relaxed text-[#f8f0c8]">
          {SECRET_DOCTRINE_EGG}
        </pre>
        <footer className="border-t-2 border-game-yellow/40 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full border-2 border-game-yellow px-3 py-2 font-pixel text-[10px] text-game-yellow transition-colors hover:bg-game-yellow hover:text-game-bg"
          >
            CLOSE (Z / ESC)
          </button>
        </footer>
      </div>
    </div>
  );
}

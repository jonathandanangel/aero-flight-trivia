type Props = {
  title: string;
  subtitle: string;
  text: string;
  accent?: "gold" | "hawk";
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

export const HAWK_EGG_TEXT = `Ra is shown like Brahma gestating in the Egg of the Universe. The deceased is "resplendent in the Egg
of the land of mysteries" (xxii., 1). For, this is "the Egg to which is given life among the gods" (xlii.,
11). "It is the Egg of the great clucking Hen, the Egg of Seb, who issues from it like a hawk" (lxiv., 1,
2, 3; lxxvii., 1).`;

const ACCENT = {
  gold: {
    box: "border-game-yellow shadow-[0_0_0_4px_#181010,inset_0_0_0_2px_#705018]",
    rule: "border-game-yellow/40",
    title: "text-game-yellow",
    btn: "border-game-yellow text-game-yellow hover:bg-game-yellow hover:text-game-bg",
  },
  hawk: {
    box: "border-[#c87838] shadow-[0_0_0_4px_#181010,inset_0_0_0_2px_#804828]",
    rule: "border-[#c87838]/40",
    title: "text-[#e8a858]",
    btn: "border-[#c87838] text-[#e8a858] hover:bg-[#c87838] hover:text-game-bg",
  },
} as const;

export function EggReader({ title, subtitle, text, accent = "gold", onClose }: Props) {
  const a = ACCENT[accent];
  const titleId = `${title.toLowerCase().replace(/\s+/g, "-")}-title`;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-3">
      <div
        className={`pointer-events-auto flex max-h-[min(92%,520px)] w-full max-w-lg flex-col border-4 bg-[#201808] ${a.box}`}
        role="dialog"
        aria-labelledby={titleId}
      >
        <header className={`border-b-2 px-4 py-3 ${a.rule}`}>
          <p id={titleId} className={`text-[10px] tracking-[0.28em] ${a.title}`}>
            {title}
          </p>
          <p className="mt-1 text-[9px] text-game-orange">{subtitle}</p>
        </header>
        <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-3 font-pixel text-[9px] leading-relaxed text-[#f8f0c8]">
          {text}
        </pre>
        <footer className={`border-t-2 px-4 py-3 ${a.rule}`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full border-2 px-3 py-2 font-pixel text-[10px] transition-colors ${a.btn}`}
          >
            CLOSE (Z / ESC)
          </button>
        </footer>
      </div>
    </div>
  );
}

export function GoldenEggReader({ onClose }: { onClose: () => void }) {
  return (
    <EggReader
      title="GOLDEN EGG"
      subtitle="Stanzas of Dzyan · The Secret Doctrine"
      text={SECRET_DOCTRINE_EGG}
      accent="gold"
      onClose={onClose}
    />
  );
}

export function HawkEggReader({ onClose }: { onClose: () => void }) {
  return (
    <EggReader
      title="HAWK EGG"
      subtitle="Egg of Seb · Ra among the gods"
      text={HAWK_EGG_TEXT}
      accent="hawk"
      onClose={onClose}
    />
  );
}

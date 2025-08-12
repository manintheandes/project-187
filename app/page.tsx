import Header from "@/components/Header";
import CaloriePanel from "@/components/CaloriePanel";
import WeightPanel from "@/components/WeightPanel";
import HistoryModal from "@/components/HistoryModal";
import ToastHost from "@/components/ToastHost";

export default function Home() {
  return (
    <div className="min-h-screen font-sans text-black bg-white">
      <div className="mx-auto max-w-[1200px] container-px md:px-8" style={{paddingLeft:32, paddingRight:32}}>
        <Header />
        <main className="mt-8 md:mt-12 grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-2 items-start content-start">
          <CaloriePanel />
          <WeightPanel />
        </main>
      </div>
      <HistoryModal />
      <ToastHost />
    </div>
  );
}

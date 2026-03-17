"use client";

import React, { createContext, useContext, useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppModalType = 'alert' | 'confirm' | 'success' | 'warning';

interface AppModalState {
    isOpen: boolean;
    type: AppModalType;
    title: string;
    message: React.ReactNode;
    resolve: ((val: boolean) => void) | null;
}

interface AppModalContextType {
    showAppModal: (title: string, message: React.ReactNode, type?: AppModalType) => Promise<boolean>;
}

const AppModalContext = createContext<AppModalContextType | undefined>(undefined);

export function AppModalProvider({ children }: { children: React.ReactNode }) {
    const [appModal, setAppModal] = useState<AppModalState>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        resolve: null
    });

    const showAppModal = (title: string, message: React.ReactNode, type: AppModalType = 'alert'): Promise<boolean> => {
        // If a modal is already open, auto-resolve it to false before opening the new one
        if (appModal.isOpen && appModal.resolve) {
            appModal.resolve(false);
        }
        return new Promise<boolean>((resolve) => {
            setAppModal({ isOpen: true, type, title, message, resolve });
        });
    };

    const handleClose = (result: boolean) => {
        if (appModal.resolve) {
            appModal.resolve(result);
        }
        setAppModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <AppModalContext.Provider value={{ showAppModal }}>
            {children}

            {appModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-7 w-full max-w-sm shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/10 pointer-events-none" />

                        <div className="flex flex-col items-center text-center relative z-10">
                            {/* Icon based on type */}
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border",
                                appModal.type === 'success' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                    appModal.type === 'warning' || appModal.type === 'confirm' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                        "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                            )}>
                                {appModal.type === 'success' && <Check size={32} />}
                                {(appModal.type === 'warning' || appModal.type === 'confirm') && <AlertTriangle size={32} />}
                                {appModal.type === 'alert' && <Info size={32} />}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3">{appModal.title}</h3>

                            <div className="text-sm text-gray-300 mb-8 max-h-[40vh] overflow-y-auto w-full px-2" style={{ whiteSpace: 'pre-line' }}>
                                {appModal.message}
                            </div>

                            <div className="flex w-full gap-3 mt-auto">
                                {appModal.type === 'confirm' && (
                                    <Button
                                        variant="ghost"
                                        className="flex-1 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800"
                                        onClick={() => handleClose(false)}
                                    >
                                        İptal
                                    </Button>
                                )}
                                <Button
                                    className={cn(
                                        "flex-1 rounded-xl text-white shadow-lg transition-all hover:scale-[1.02]",
                                        appModal.type === 'success' ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50" :
                                            appModal.type === 'confirm' ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50" :
                                                "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50"
                                    )}
                                    onClick={() => handleClose(true)}
                                >
                                    {appModal.type === 'confirm' ? "Onayla" : "Tamam"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppModalContext.Provider>
    );
}

export function useAppModal() {
    const context = useContext(AppModalContext);
    if (context === undefined) {
        throw new Error('useAppModal must be used within an AppModalProvider');
    }
    return context;
}

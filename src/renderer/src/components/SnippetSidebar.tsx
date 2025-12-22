import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar'
import { SettingsSheet } from '@/components/SettingsSheet'
import { SidebarFilterSection } from './SidebarFilterSection'
import { SidebarTagSection } from './SidebarTagSection'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { PanelLeftIcon } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'

export function SnippetSidebar() {
  const isMobile = useIsMobile()
  const { openMobile, setOpenMobile } = useSidebar()

  // On mobile (< 500px), render a Sheet instead of the sidebar
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[320px] p-0 bg-sidebar text-sidebar-foreground"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b border-sidebar-border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpenMobile(false)}
                >
                  <PanelLeftIcon className="size-4" />
                </Button>
                <SheetTitle className="text-foreground">Fragment</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-auto">
              <SidebarFilterSection />
              <SidebarTagSection />
            </div>
            <div className="border-t border-sidebar-border p-2">
              <SettingsSheet />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // On desktop, render the normal collapsible sidebar
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3.5 border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="truncate transition-all duration-200 ease-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              Fragment
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarFilterSection />
        <SidebarTagSection />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
          <SettingsSheet />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

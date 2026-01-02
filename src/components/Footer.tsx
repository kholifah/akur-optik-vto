import React from "react"

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-background">
        <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <h3 className="font-serif font-bold mb-4">AKUR OPTIC</h3>
                    <p className="text-sm text-muted-foreground">Premium eyewear with innovative AR try-on technology.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4 text-sm">Shop</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="#eyeglasses" className="hover:text-accent transition-colors">Eyeglasses</a></li>
                        <li><a href="#sunglasses" className="hover:text-accent transition-colors">Sunglasses</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4 text-sm">Support</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
                        <li><a href="#" className="hover:text-accent transition-colors">FAQ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4 text-sm">Legal</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-accent transition-colors">Privacy</a></li>
                        <li><a href="#" className="hover:text-accent transition-colors">Terms</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
                <p>&copy; 2025 Akur Optic. All rights reserved.</p>
            </div>
        </div>
    </footer>
  )
}
